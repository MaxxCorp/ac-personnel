// Force HMR reload
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

// @ts-ignore
import { query, form } from '$app/server';

// @ts-ignore
export const getUserNotifications = query(async (event: RequestEvent) => {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    return await db.query.notifications.findMany({
        where: eq(notifications.userId, session.user.id),
        orderBy: [desc(notifications.createdAt)],
        limit: 50 // reasonable limit
    });
});

// @ts-ignore
export const markNotificationRead = form(async (event: RequestEvent) => {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const formData = await event.request.formData();
    const notificationId = parseInt(formData.get('notificationId') as string);

    // Verify ownership
    const notification = await db.query.notifications.findFirst({
        where: eq(notifications.id, notificationId)
    });

    if (!notification || notification.userId !== session.user.id) {
        throw new Error('Notification not found or unauthorized');
    }

    await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId));
});


