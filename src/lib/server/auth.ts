import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink, admin } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'applicant',
				input: false // Don't allow user to set on sign up
			}
		}
	},
	emailAndPassword: { enabled: true },
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID!,
			clientSecret: env.GOOGLE_CLIENT_SECRET!
		},
		microsoft: {
			clientId: env.MICROSOFT_CLIENT_ID!,
			clientSecret: env.MICROSOFT_CLIENT_SECRET!,
			tenantId: env.MICROSOFT_TENANT_ID!
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent),
		admin({ defaultRole: 'applicant' }),
		magicLink({
			sendMagicLink: async ({ email, token, url }, request) => {
				console.log(`Magic Link for ${email}: ${url}`);
				// TODO: Implement actual email sending
			}
		})
	]
});
