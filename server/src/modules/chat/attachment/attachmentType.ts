export interface CreateUploadUrlInput{
    coversationalId:string,
    originalName:string,
    mimType:string,
    sizeByte:number,
}

export interface CreateUploadUrlResponse {
    uploadId: string;
    uploadUrl: string;
    storageKey: string;
    expiresIn: number;
  }