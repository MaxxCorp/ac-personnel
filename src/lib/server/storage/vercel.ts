import type { StorageAdapter } from './adapter';
import { put, del } from '@vercel/blob';
import { env } from '$env/dynamic/private';

export class VercelBlobAdapter implements StorageAdapter {
    async upload(file: File, path: string): Promise<{ url: string; storagePath: string }> {
        const { url } = await put(path, file, {
            access: 'public',
            token: env.VERCEL_BLOB_READ_WRITE_TOKEN
        });
        return {
            url,
            storagePath: url // Vercel Blob uses URL as the handle mostly, or we can store the full url as path.
        };
    }

    async delete(path: string): Promise<void> {
        await del(path, {
            token: env.VERCEL_BLOB_READ_WRITE_TOKEN
        });
    }
}
