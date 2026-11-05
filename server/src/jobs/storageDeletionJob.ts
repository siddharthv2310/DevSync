
import cron from "node-cron";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import prisma from "../config/prisma.js";
import s3Client from "../config/s3.js";
import { AWS_CONFIG } from "../config/aws.js";

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

// A PROCESSING job older than this is considered abandoned.
// This helps recover jobs if the server crashes during deletion.
const STALE_JOB_MINUTES = 15;

let isRunning = false;

type DeletionCandidate = {
  id: string;
  storageKey: string;
  attempts: number;
  status: "PENDING" | "PROCESSING";
  updatedAt: Date;
};

// Claim a job atomically so two workers don't normally process
// the same pending job at the same time.
const claimJob = async (job: DeletionCandidate) => {
  const now = new Date();

  const result = await prisma.storageDeletionJob.updateMany({
    where: {
      id: job.id,
      status: job.status,
      updatedAt: job.updatedAt,
      ...(job.status === "PENDING"
        ? { nextAttemptAt: { lte: now } }
        : {}),
    },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
    },
  });

  if (result.count === 0) return null;

  // Read the claimed record so we can use its updatedAt as a
  // guard when marking it complete or scheduling a retry.
  return prisma.storageDeletionJob.findUnique({
    where: { id: job.id },
    select: {
      id: true,
      storageKey: true,
      attempts: true,
      updatedAt: true,
    },
  });
};

const processOneJob = async (job: DeletionCandidate) => {
  const claimedJob = await claimJob(job);

  // Another worker may already have claimed this job.
  if (!claimedJob) return;

  try {
    // Delete the actual object from AWS S3.
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: claimedJob.storageKey,
      })
    );

    // Mark the job completed only if we still own this claim.
    await prisma.storageDeletionJob.updateMany({
      where: {
        id: claimedJob.id,
        status: "PROCESSING",
        updatedAt: claimedJob.updatedAt,
      },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        lastError: null,
      },
    });

    console.log(
      `S3 file deleted successfully: ${claimedJob.storageKey}`
    );
  } 
  catch (error) {

    const errorMessage = error instanceof Error ? error.message : String(error);

    const isFinalAttempt = claimedJob.attempts >= MAX_ATTEMPTS;

    // Exponential backoff: 1, 2, 4, 8, 16 minutes.
    const retryMinutes = Math.min(
      2 ** (claimedJob.attempts - 1),
      60
    );

    const nextAttemptAt = new Date(
      Date.now() + retryMinutes * 60 * 1000
    );

    await prisma.storageDeletionJob.updateMany({
      where: {
        id: claimedJob.id,
        status: "PROCESSING",
        updatedAt: claimedJob.updatedAt,
      },
      data: {
        status: isFinalAttempt ? "FAILED" : "PENDING",
        lastError: errorMessage.slice(0, 2000),
        nextAttemptAt,
      },
    });

    console.error(
      `S3 deletion failed for ${claimedJob.storageKey}:`,
      errorMessage
    );
  }
};

export const processStorageDeletionJobs = async () => {
  const now = new Date();

  const staleBefore = new Date(
    now.getTime() - STALE_JOB_MINUTES * 60 * 1000
  );

  // Get jobs that are ready for processing.
  const pendingJobs = await prisma.storageDeletionJob.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: now },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: {
      id: true,
      storageKey: true,
      attempts: true,
      status: true,
      updatedAt: true,
    },
  });

  // Recover jobs left PROCESSING after a server crash.
  const staleJobs = await prisma.storageDeletionJob.findMany({
    where: {
      status: "PROCESSING",
      updatedAt: { lt: staleBefore },
    },
    orderBy: { updatedAt: "asc" },
    take: BATCH_SIZE,
    select: {
      id: true,
      storageKey: true,
      attempts: true,
      status: true,
      updatedAt: true,
    },
  });

  const jobs = [...pendingJobs, ...staleJobs]
  .filter((job): job is DeletionCandidate => job.status === "PENDING" || job.status === "PROCESSING")
  .slice(0, BATCH_SIZE);

  for (const job of jobs) {
    await processOneJob(job);
  }

  return {
    processed: jobs.length,
  };
};

export const startStorageDeletionJob = () => {
  if (!AWS_CONFIG.bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }

  const runWorker = async () => {
    if (isRunning) return;

    isRunning = true;

    try {
      const result = await processStorageDeletionJobs();

      if (result.processed > 0) {
        console.log("Storage deletion worker result:", result);
      }
    } 
    
    catch (error) {
      console.error("Storage deletion worker failed:", error);
    } 
    
    finally {
      isRunning = false;
    }
  };

  // Process pending jobs once when the server starts.
  void runWorker();

  // Then check for jobs every minute.
  cron.schedule("* * * * *", runWorker);

  console.log("Storage deletion worker started");
};
