export interface StorageAdapter {
    /**
     * Uploads a file to the storage provider.
     * @param file The file to upload.
     * @param path The destination path/filename.
     * @returns The public URL and the storage path (if different or needed for deletion).
     */
    upload(file: File, path: string): Promise<{ url: string; storagePath: string }>;

    /**
     * Deletes a file from the storage provider.
     * @param path The storage path of the file to delete.
     */
    delete(path: string): Promise<void>;
}
