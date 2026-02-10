import { db } from '$lib/server/db';
import { absenceRequests, employees } from '$lib/server/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { notifyUser } from '$lib/server/notifications';

export async function requestAbsence(event: RequestEvent, employeeId: number, startDate: Date, endDate: Date, type: 'vacation' | 'sick' | 'other', reason?: string) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
    });

    if (!employee) throw new Error('Employee not found');
    if (employee.userId !== session.user.id && !['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    if (endDate < startDate) {
        throw new Error('End date must be after start date');
    }

    await db.insert(absenceRequests).values({
        employeeId,
        startDate,
        endDate,
        type,
        reason,
        status: 'pending'
    });
}

export async function getEmployeeAbsences(event: RequestEvent, employeeId: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
    });

    if (!employee) throw new Error('Employee not found');
    if (employee.userId !== session.user.id && !['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    return await db.query.absenceRequests.findMany({
        where: eq(absenceRequests.employeeId, employeeId),
        orderBy: [desc(absenceRequests.startDate)]
    });
}

export async function getPendingAbsenceRequests(event: RequestEvent) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    if (!['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    const requests = await db.query.absenceRequests.findMany({
        where: eq(absenceRequests.status, 'pending'),
        orderBy: [desc(absenceRequests.startDate)],
        with: {
            // @ts-ignore
            employee: true
        }
    });

    return requests;
}

export async function updateAbsenceStatus(event: RequestEvent, requestId: number, status: 'approved' | 'rejected', notes?: string) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    if (!['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    const [updated] = await db.update(absenceRequests)
        .set({ status, reviewerNote: notes, updatedAt: new Date() })
        .where(eq(absenceRequests.id, requestId))
        .returning();

    if (updated) {
        const employee = await db.query.employees.findFirst({
            where: eq(employees.id, updated.employeeId)
        });
        if (employee && employee.userId) {
            await notifyUser(event, employee.userId, `Your absence request for ${new Date(updated.startDate).toLocaleDateString()} was ${status}.`, status === 'approved' ? 'success' : 'warning', 'absence_request', updated.id);
        }
    }

    return updated;
}

export async function deleteAbsenceRequest(event: RequestEvent, requestId: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    if (!['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    await db.delete(absenceRequests).where(eq(absenceRequests.id, requestId));
}
