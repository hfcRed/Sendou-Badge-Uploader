import { github } from '$lib/server/github';
import { generateState } from 'arctic';
import type { RequestEvent } from '../$types';

export function GET(event: RequestEvent) {
	const state = generateState();
	const url = github.createAuthorizationURL(state, ['gist']);

	event.cookies.set('github_auth_state', state, {
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
}
