import type { RequestHandler } from './$types';
import { generateState } from 'arctic';
import { redirect } from '@sveltejs/kit';
import { githubClient } from '$lib/server/github/constants';

export const GET: RequestHandler = ({ cookies, locals }) => {
	if (locals.user) redirect(302, '/');

	const state = generateState();
	const url = githubClient.createAuthorizationURL(state, ['public_repo']);

	cookies.set('github_auth_state', state, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
};
