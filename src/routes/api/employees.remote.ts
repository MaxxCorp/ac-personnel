import { db } from '$lib/server/db';
import { employees, applicants, type EmployeeStatus, type Role } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { error, type RequestEvent } from '@sveltejs/kit';

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
import { number } from 'valibot';

export const createEmployee = form(createEmployeeSchema, async (data) => {
    const requestEvent = getRequestEvent();
    if (!requestEvent) throw new Error('No request event');

    const session = await auth.api.getSession({ headers: requestEvent.request.headers });
    if (!session || !['admin', 'leadership', 'talentManagement'].includes(session.user.role || '')) {
        error(401, 'Unauthorized');
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
        await getAllEmployees().refresh();
        return newEmployee;
    } catch (err) {
        console.error('Database Insertion Error:', err);
        error(500, 'Database Insertion Error');
    }
});

export const deleteEmployee = command(number(), async (id) => {
    const requestEvent = getRequestEvent();
    if (!requestEvent) throw new Error('No request event');

    const session = await auth.api.getSession({ headers: requestEvent.request.headers });
    if (!session || !['admin'].includes(session.user.role || '')) {
        error(401, 'Unauthorized');
    }

    try {
        await db.delete(employees).where(eq(employees.id, id));
        // Use invalidateAll on client side instead of refresh here if easier, but refresh is fine for remote function.
        // Or if getAllEmployees is a query, we can refresh it.
        // Check if getAllEmployees is actually available here to refresh. Yes it is exported in same file.
        // await getAllEmployees.refresh(); // This might be the issue if getAllEmployees is not a query object but the function?
        // getAllEmployees is defined as `export const getAllEmployees = query(...)` so it should be fine.

        // However, previous error in step 45 was: "Argument of type ... is not assignable to parameter of type 'RemoteQueryOverride...'"
        // user commented out `getAllEmployees().refresh()` in createEmployee but I should try to use it if possible or just return success.
        // For now, let's just return success and handle invalidation on client.

        // Update the query cache
        await getAllEmployees().refresh();
        return { success: true };
    } catch (err) {
        console.error('Delete Employee Error:', err);
        error(500, 'Failed to delete employee');
    }
});
