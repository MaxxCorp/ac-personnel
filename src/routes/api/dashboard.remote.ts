import { auth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

import { query } from '$app/server';
import { getRequestEvent } from '$app/server';

export const getDashboardRedirect = query(async () => {
    const event = getRequestEvent();
    if (!event) throw new Error('No request event');

    const session = await auth.api.getSession({ headers: event.request.headers });

    if (!session) {
        return '/';
    }

    const role = session.user.role || '';

    if (['admin', 'leadership', 'talentManagement'].includes(role)) {
        return '/dashboard';
    } else if (role === 'employee') {
        return '/time';
    }

    // Default for applicants or others
    return '/onboarding';
});
