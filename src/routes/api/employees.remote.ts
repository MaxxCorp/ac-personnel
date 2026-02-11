import { db } from '$lib/server/db';
import { employees, applicants, type EmployeeStatus, type Role } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';

export const getAllEmployees = query(async () => {
    const event = getRequestEvent();
    if (!event) throw new Error('No request event'); // Safety check
    const session = await auth.api.getSession({ headers: event.request.headers });

    if (!session || !['admin', 'leadership', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }
    const result = await db.select().from(employees);
    console.log(`getAllEmployees returning ${result.length} employees`);
    return result;
});

// export async function hireApplicant(event: RequestEvent, applicantId: number, data: { personalEmail: string; firstName: string; lastName: string; role: Role; department?: string; position?: string }) {
//     const session = await auth.api.getSession({ headers: event.request.headers });
//     if (!session || !['admin', 'talentManagement'].includes(session.user.role || '')) {
//         throw new Error('Unauthorized');
//     }
//
//     // 1. Create Employee Record
//     const [newEmployee] = await db.insert(employees).values({
//         ...data,
//         applicantId,
//         status: 'onboarding',
//         workEmail: null // Assigned later
//     }).returning();
//
//     // 2. Trigger Magic Link
//     // We use the Better Auth API to sign in via magic link.
//     // Since the user might not exist in the `user` table yet, magic link flow handles creation if configured,
//     // or we pre-create the user?
//     // Better Auth Magic Link: "If the user doesn't exist, it will create a new user..."
//
//     await auth.api.signInMagicLink({
//         body: {
//             email: data.personalEmail,
//             name: `${data.firstName} ${data.lastName}`,
//             callbackURL: '/onboarding' // Redirect here after login
//         },
//         headers: event.request.headers
//     });
//
//     // 3. Update Applicant Status
//     await db.update(applicants).set({ status: 'hired' }).where(eq(applicants.id, applicantId));
//
//     return newEmployee;
// }

interface CreateEmployeeInput {
    firstName: string;
    lastName: string;
    personalEmail: string;
    role: Role;
    department: string;
}

import { form } from '$app/server';
import { createEmployeeSchema } from '$lib/schemas';

export const createEmployee = form(createEmployeeSchema, async (data) => {
    const requestEvent = getRequestEvent();
    if (!requestEvent) throw new Error('No request event');

    console.log('createEmployee called with:', data);

    const session = await auth.api.getSession({ headers: requestEvent.request.headers });
    if (!session || !['admin', 'leadership', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    const { firstName, lastName, personalEmail, role, department } = data;

    try {
        // 1. Create Employee Record
        const [newEmployee] = await db.insert(employees).values({
            firstName,
            lastName,
            personalEmail,
            role,
            department,
            status: 'onboarding',
            workEmail: null // Assigned later
        }).returning();

        // Update the query cache
        // await getAllEmployees().refresh(); // Causing serialization error
        console.log('Employee created successfully:', newEmployee);
        return newEmployee;
    } catch (err) {
        console.error('Database Insertion Error:', err);
        throw err;
    }
});
