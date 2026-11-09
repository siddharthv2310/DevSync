import { Request, Response, NextFunction } from "express";
import { OrganizationRole, projectRole } from "@prisma/client";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

import {
  taskAttachmentParamsSchema,
  generateTaskAttachmentUploadSchema,
  completeTaskAttachmentUploadSchema,
  listTaskAttachmentsQuerySchema,
} from "./taskAttachments/taskAttachmentValidation.js";

import {
  generateTaskAttachmentUploadUrl,
  completeTaskAttachmentUpload,
  getTaskAttachments,
  generateTaskAttachmentDownloadUrl,
  deleteTaskAttachment,
} from "./taskAttachments/taskAttachmentServices.js";

const getTaskAccess = (req: Request) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiErrors(401, "Unauthorized");
  }

  const organizationRole = req.organizationMember?.role;
  const memberRole = req.projectMember?.role;

  const canManageAnyTask =
    organizationRole === OrganizationRole.OWNER ||
    organizationRole === OrganizationRole.ADMIN ||
    memberRole === projectRole.OWNER ||
    memberRole === projectRole.ADMIN;

  return {
    projectId: req.params.projectId,
    taskId: req.params.taskId,
    userId,
    canManageAnyTask,
  };
};

// Generate upload URL
export const generateTaskAttachmentUploadUrlController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const params = taskAttachmentParamsSchema.parse(req.params);
    const file = generateTaskAttachmentUploadSchema.parse(req.body);

    const data = await generateTaskAttachmentUploadUrl({
      ...getTaskAccess(req),
      projectId: params.projectId,
      taskId: params.taskId,
      file,
    });

    res.status(201).json({
      success: true,
      message: "Upload URL generated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Complete upload
export const completeTaskAttachmentUploadController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const params = taskAttachmentParamsSchema.parse(req.params);
    const body = completeTaskAttachmentUploadSchema.parse(req.body);

    const data = await completeTaskAttachmentUpload({
      ...getTaskAccess(req),
      projectId: params.projectId,
      taskId: params.taskId,
      uploadId: body.uploadId,
    });

    res.status(200).json({
      success: true,
      message: "Attachment uploaded successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// List attachments
export const getTaskAttachmentsController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const params = taskAttachmentParamsSchema.parse(req.params);
    const query = listTaskAttachmentsQuerySchema.parse(req.query);

    const data = await getTaskAttachments({
      ...getTaskAccess(req),
      projectId: params.projectId,
      taskId: params.taskId,
      pagination: query,
    });

    res.status(200).json({
      success: true,
      message: "Task attachments fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Download attachment
export const downloadTaskAttachmentController = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const params = taskAttachmentParamsSchema.parse(req.params);

    if (!params.attachmentId) {
      throw new ApiErrors(400, "Attachment ID is required");
    }

    const data = await generateTaskAttachmentDownloadUrl({
      ...getTaskAccess(req),
      projectId: params.projectId,
      taskId: params.taskId,
      attachmentId: params.attachmentId,
    });

    res.status(200).json({
      success: true,
      message: "Download URL generated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Delete attachment
export const deleteTaskAttachmentController = async ( req: Request, res: Response, next: NextFunction) => {
  try {
    const params = taskAttachmentParamsSchema.parse(req.params);

    if (!params.attachmentId) {
      throw new ApiErrors(400, "Attachment ID is required");
    }

    const data = await deleteTaskAttachment({
      ...getTaskAccess(req),
      projectId: params.projectId,
      taskId: params.taskId,
      attachmentId: params.attachmentId,
    });

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};