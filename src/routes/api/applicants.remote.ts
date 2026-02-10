import { db } from '$lib/server/db';
import { applicants, applicationStatus, type ApplicationStatus } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function getApplicants(event: RequestEvent) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session || !['admin', 'leadership', 'talentManagement', 'hiringManager'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }
    return await db.select().from(applicants);
}

export async function updateApplicantStatus(event: RequestEvent, id: number, status: ApplicationStatus) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session || !['admin', 'talentManagement', 'hiringManager'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }
    // Validate status
    if (!applicationStatus.includes(status)) {
        throw new Error('Invalid status');
    }
    return await db.update(applicants).set({ status }).where(eq(applicants.id, id)).returning();
}

export async function createApplicant(event: RequestEvent, data: { name: string; email: string; resumeUrl?: string; notes?: string }) {
    // Publicly accessible for now (e.g. from a career page), or restrict if internal only. 
    // For this task, let's assume internal creation by talent management or public apply.
    // If internal:
    // const session = await auth.api.getSession({ headers: event.request.headers });
    // if (!session || ... ) ...

    // For now, let's allow basic creation.
    return await db.insert(applicants).values(data).returning();
}
