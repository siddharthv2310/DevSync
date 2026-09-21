import { useState, type ChangeEvent } from "react";
import axios, { AxiosError } from "axios";

const BACKEND_URL = "http://localhost:8000";

interface AttachmentTestProps {
  conversationId: string;
}

interface UploadResponse {
    id: string;
    originalName: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    status: string;
    completedAt: string | null;
  }

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface UploadUrlData {
  uploadId: string;
  uploadUrl: string;
}

interface ErrorResponse {
  message?: string;
}

type UploadStatus =
  | "idle"
  | "selected"
  | "requesting-url"
  | "uploading"
  | "verifying"
  | "completed"
  | "error";

const AttachmentTest = ({
  conversationId,
}: AttachmentTestProps) => {
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<UploadStatus>("idle");

  const [progress, setProgress] = useState<number>(0);

  const [error, setError] = useState<string>("");

  const [uploadedAttachment, setUploadedAttachment] =
    useState<UploadResponse | null>(null);

  // ---------------------------------------------
  // FILE SELECT
  // ---------------------------------------------

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setStatus("selected");
    setProgress(0);
    setError("");
    setUploadedAttachment(null);
  };

  // ---------------------------------------------
  // REMOVE FILE
  // ---------------------------------------------

  const removeFile = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError("");
    setUploadedAttachment(null);
  };

  // ---------------------------------------------
  // UPLOAD FILE
  // ---------------------------------------------

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setError("");
      setProgress(0);

      // ---------------------------------------------
      // STEP 1: Request presigned URL
      // ---------------------------------------------

      setStatus("requesting-url");

      const response = await axios.post<
        ApiResponse<UploadUrlData>
      >(
        `${BACKEND_URL}/api/v1/conversations/${conversationId}/attachments/upload-url`,
        {
          originalName: file.name,
          mimeType:
            file.type || "application/octet-stream",
          sizeBytes: file.size,
        },
        {
          withCredentials: true,
        }
      );

      const {
        uploadId: newUploadId,
        uploadUrl,
      } = response.data.data;

      // ---------------------------------------------
      // STEP 2: Upload directly to S3
      // ---------------------------------------------

      setStatus("uploading");

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type":
            file.type || "application/octet-stream",
        },

        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;

          const percentage = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

          setProgress(percentage);
        },
      });

      // ---------------------------------------------
      // STEP 3: Tell backend upload is complete
      // ---------------------------------------------

      setStatus("verifying");

      const completeResponse = await axios.post<
        ApiResponse<UploadResponse>
      >(
        `${BACKEND_URL}/api/v1/conversations/${conversationId}/attachments/${newUploadId}/complete`,
        {},
        {
          withCredentials: true,
        }
      );

      // ---------------------------------------------
      // STEP 4: Success
      // ---------------------------------------------

      setStatus("completed");
      setProgress(100);

      setUploadedAttachment(
        completeResponse.data.data
      );
    } catch (err: unknown) {
      console.error("Attachment upload error:", err);

      setStatus("error");

      const axiosError =
        err as AxiosError<ErrorResponse>;

      if (axiosError.response?.data?.message) {
        setError(
          axiosError.response.data.message
        );
      } else if (axiosError.response) {
        setError(
          `Upload failed with status ${axiosError.response.status}`
        );
      } else if (axiosError.message) {
        setError(axiosError.message);
      } else {
        setError("Something went wrong");
      }
    }
  };

  // ---------------------------------------------
  // FORMAT FILE SIZE
  // ---------------------------------------------

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(2)} MB`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(2)} GB`;
  };

  // ---------------------------------------------
  // STATUS TEXT
  // ---------------------------------------------

  const getStatusText = (): string => {
    switch (status) {
      case "selected":
        return "File selected";

      case "requesting-url":
        return "Preparing upload...";

      case "uploading":
        return `Uploading... ${progress}%`;

      case "verifying":
        return "Verifying upload...";

      case "completed":
        return "Upload completed successfully";

      case "error":
        return "Upload failed";

      default:
        return "Select a file";
    }
  };

  const isUploading =
    status === "requesting-url" ||
    status === "uploading" ||
    status === "verifying";

  // ---------------------------------------------
  // UI
  // ---------------------------------------------

  return (
    <div className="w-full max-w-xl p-6 mx-auto mt-10 bg-white border rounded-xl shadow-sm">
      <h2 className="mb-2 text-2xl font-semibold">
        S3 Attachment Test
      </h2>

      <p className="mb-6 text-sm text-gray-500">
        Test the complete DevSync attachment upload flow.
      </p>

      {/* File Input */}

      <label
        htmlFor="attachment"
        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
      >
        <span className="mb-2 text-gray-600">
          Choose a file
        </span>

        <span className="text-sm text-gray-400">
          Click here to browse
        </span>

        <input
          id="attachment"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      {/* File Information */}

      {file && (
        <div className="p-4 mt-5 border rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {file.name}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {file.type || "Unknown type"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>

            <button
              type="button"
              onClick={removeFile}
              disabled={isUploading}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Progress */}

      {(status === "uploading" ||
        status === "verifying" ||
        status === "completed") && (
        <div className="mt-5">
          <div className="flex justify-between mb-2 text-sm">
            <span>{getStatusText()}</span>

            <span>{progress}%</span>
          </div>

          <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
            <div
              className="h-full transition-all duration-300 bg-blue-600"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Status */}

      <div className="mt-5 text-sm">
        <span className="font-medium">
          Status:
        </span>{" "}
        {getStatusText()}
      </div>

      {/* Error */}

      {error && (
        <div className="p-3 mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Button */}

      <button
        type="button"
        onClick={uploadFile}
        disabled={
          !file ||
          isUploading ||
          status === "completed"
        }
        className="w-full px-4 py-3 mt-6 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "requesting-url"
          ? "Preparing..."
          : status === "uploading"
            ? `Uploading ${progress}%`
            : status === "verifying"
              ? "Verifying..."
              : status === "completed"
                ? "Uploaded"
                : "Upload File"}
      </button>

      {/* Successful Upload Information */}

      {uploadedAttachment && (
        <div className="p-4 mt-5 border border-green-200 rounded-lg bg-green-50">
          <p className="font-medium text-green-700">
            ✓ Upload successful
          </p>

          <div className="mt-2 text-sm text-gray-700">
            <p>
              <strong>Upload ID:</strong>{" "}
              {uploadedAttachment.id}
            </p>

            <p>
              <strong>File:</strong>{" "}
              {uploadedAttachment.originalName}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {uploadedAttachment.status}
            </p>

            <p>
              <strong>Storage Key:</strong>{" "}
              {uploadedAttachment.storageKey}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentTest;