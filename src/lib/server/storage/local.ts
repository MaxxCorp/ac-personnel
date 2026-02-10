import type { StorageAdapter } from './adapter';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export class LocalStorageAdapter implements StorageAdapter {
    private uploadDir: string;
    private baseUrl: string;

    constructor(uploadDir: string = 'static/uploads', baseUrl: string = '/uploads') {
        this.uploadDir = uploadDir;
        this.baseUrl = baseUrl;
    }

    async upload(file: File, path: string): Promise<{ url: string; storagePath: string }> {
        // Ensure directory exists
        const fullPath = join(process.cwd(), this.uploadDir, path);
        const dir = fullPath.split('/').slice(0, -1).join('/');
        
        // Node's mkdir with recursive: true handles nested dirs
        if (!existsSync(dir)) {
             // Basic check, though mkdir recursive usually handles it. 
             // using node:path join might use backslashes on windows, so careful with strict / logic if mixing.
             // simpler to just try mkdir directly on the dirname of fullPath.
        }
        // Actually, let's just use the strict Node path handling.
        const targetDir = join(process.cwd(), this.uploadDir);
        // We might want to support subdirectories in 'path' arg.
        
        // Ensure the base upload dir exists at least
        await mkdir(targetDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        // For local, we just allow the key to be the filename for simplicity, 
        // but to avoid collisions usually we expect 'path' to include some uniqueness.
        const dest = join(targetDir, path);
        
        await writeFile(dest, buffer);

        return {
            url: `${this.baseUrl}/${path}`,
            storagePath: path
        };
    }

    async delete(path: string): Promise<void> {
        const fullPath = join(process.cwd(), this.uploadDir, path);
        try {
            await unlink(fullPath);
        } catch (e) {
            console.warn(`Failed to delete local file ${fullPath}`, e);
        }
    }
}
