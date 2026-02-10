import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import type { RequestEvent } from '@sveltejs/kit';

export async function notifyUser(event: RequestEvent, userId: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info', relatedEntityType?: string, relatedEntityId?: number) {
    await db.insert(notifications).values({
        userId,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
        read: false
    });
}
