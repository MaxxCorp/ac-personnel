import { db } from '$lib/server/db';
import { employees, applicants, type EmployeeStatus, type Role } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function getEmployees(event: RequestEvent) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session || !['admin', 'leadership', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }
    return await db.select().from(employees);
}

export async function hireApplicant(event: RequestEvent, applicantId: number, data: { personalEmail: string; firstName: string; lastName: string; role: Role; department?: string; position?: string }) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session || !['admin', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    // 1. Create Employee Record
    const [newEmployee] = await db.insert(employees).values({
        ...data,
        applicantId,
        status: 'onboarding',
        workEmail: null // Assigned later
    }).returning();

    // 2. Trigger Magic Link
    // We use the Better Auth API to sign in via magic link. 
    // Since the user might not exist in the `user` table yet, magic link flow handles creation if configured, 
    // or we pre-create the user?
    // Better Auth Magic Link: "If the user doesn't exist, it will create a new user..."

    await auth.api.signInMagicLink({
        body: {
            email: data.personalEmail,
            name: `${data.firstName} ${data.lastName}`,
            callbackURL: '/onboarding' // Redirect here after login
        },
        headers: event.request.headers
    });

    // 3. Update Applicant Status
    await db.update(applicants).set({ status: 'hired' }).where(eq(applicants.id, applicantId));

    return newEmployee;
}
