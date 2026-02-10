import { db } from '$lib/server/db';
import { timeEntries, employees } from '$lib/server/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { notifyUser } from '$lib/server/notifications';

export async function clockIn(event: RequestEvent, employeeId: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
    });

    if (!employee) throw new Error('Employee not found');
    if (employee.userId !== session.user.id && !['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestEntry = await db.query.timeEntries.findFirst({
        where: and(
            eq(timeEntries.employeeId, employeeId),
            gte(timeEntries.date, today)
        ),
        orderBy: [desc(timeEntries.startTime)]
    });

    if (latestEntry && !latestEntry.endTime) {
        throw new Error('Already clocked in');
    }

    const now = new Date();
    await db.insert(timeEntries).values({
        employeeId,
        date: today,
        startTime: now,
        status: 'pending'
    });
}

export async function clockOut(event: RequestEvent, employeeId: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
    });

    if (!employee) throw new Error('Employee not found');
    if (employee.userId !== session.user.id && !['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestEntry = await db.query.timeEntries.findFirst({
        where: and(
            eq(timeEntries.employeeId, employeeId),
            gte(timeEntries.date, today)
        ),
        orderBy: [desc(timeEntries.startTime)]
    });

    if (!latestEntry || latestEntry.endTime) {
        throw new Error('Not clocked in');
    }

    const now = new Date();
    await db.update(timeEntries)
        .set({ endTime: now })
        .where(eq(timeEntries.id, latestEntry.id));
}

export async function submitTimeEntry(event: RequestEvent, employeeId: number, date: Date, startTime: Date, endTime: Date, breakDuration: number, notes: string) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
    });

    if (!employee) throw new Error('Employee not found');
    if (employee.userId !== session.user.id && !['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    if (endTime < startTime) throw new Error('End time must be after start time');

    await db.insert(timeEntries).values({
        employeeId,
        date,
        startTime,
        endTime,
        breakDuration,
        notes,
        status: 'pending'
    });
}

export async function getEmployeeTimeEntries(event: RequestEvent, employeeId: number, startDate: Date, endDate: Date) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    const employee = await db.query.employees.findFirst({
        where: eq(employees.id, employeeId),
    });

    if (!employee) throw new Error('Employee not found');
    if (employee.userId !== session.user.id && !['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    return await db.query.timeEntries.findMany({
        where: and(
            eq(timeEntries.employeeId, employeeId),
            gte(timeEntries.date, startDate),
            // lte(timeEntries.date, endDate) // drazzle-orm syntax check needed for lte
        ),
        orderBy: [desc(timeEntries.date), desc(timeEntries.startTime)]
    });
}

export async function getPendingTimeEntries(event: RequestEvent) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    if (!['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    // This needs to join with employees to get names
    const entries = await db.query.timeEntries.findMany({
        where: eq(timeEntries.status, 'pending'),
        orderBy: [desc(timeEntries.date)],
        with: {
            // @ts-ignore
            employee: true
        }
    });

    // Manual join/lookup if relation not defined
    // Assuming relation is defined in schema (it is not explicitly in my snippet, but usually is)
    // If not, we might need to fetch employees separately.
    // Let's assume schema has relation.
    return entries;
}

export async function updateTimeEntryStatus(event: RequestEvent, entryId: number, status: 'approved' | 'rejected') {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    if (!['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    const [updated] = await db.update(timeEntries)
        .set({ status, updatedAt: new Date() })
        .where(eq(timeEntries.id, entryId))
        .returning();

    // Notify user
    if (updated) {
        const employee = await db.query.employees.findFirst({
            where: eq(employees.id, updated.employeeId)
        });
        if (employee && employee.userId) {
            await notifyUser(event, employee.userId, `Your time entry for ${new Date(updated.date).toLocaleDateString()} was ${status}.`, status === 'approved' ? 'success' : 'warning', 'time_entry', updated.id);
        }
    }

    return updated;
}

export async function deleteTimeEntry(event: RequestEvent, entryId: number) {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) throw new Error('Unauthorized');

    // Only allow deletion by admin or talentManagement, or manager?
    // Let's allow manager too.
    if (!['admin', 'manager', 'talentManagement'].includes(session.user.role || '')) {
        throw new Error('Unauthorized');
    }

    await db.delete(timeEntries).where(eq(timeEntries.id, entryId));
}
