import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { LocalStorageAdapter } from './local';
import { VercelBlobAdapter } from './vercel';
import type { StorageAdapter } from './adapter';

export function getStorageAdapter(): StorageAdapter {
    // If explicitly configured or in production, use Vercel. 
    // User asked: "Option 2 (Cloud) for deployments and Option 1 (Local) for local development"
    
    // We can check `dev` from $app/environment (only works in browser/during build? No, works in server too if using import)
    // Actually, strictly checking NODE_ENV or `dev` boolean is best.
    
    // For strictly server-side switching:
    if (process.env.NODE_ENV === 'production') {
        return new VercelBlobAdapter();
    }
    
    // Default to local for dev
    return new LocalStorageAdapter();
}
