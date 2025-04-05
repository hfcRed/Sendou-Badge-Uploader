import { github } from '$lib/server/github';
import type { OAuth2Tokens } from 'arctic';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent) {
	console.log('Received callback from GitHub:', event.url.toString());
	const storedState = event.cookies.get('github_auth_state') ?? null;
	const code = event.url.searchParams.get('code') ?? null;
	const state = event.url.searchParams.get('state') ?? null;
	console.log('Stored state:', storedState);
	console.log('Code:', code);
	console.log('State:', state);
	console.log('Cookies:', event.cookies.getAll());

	if (!storedState || !code || !state) {
		return new Response('Missing parameters', { status: 400 });
	}
	if (storedState !== state) {
		return new Response('Invalid state', { status: 403 });
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch (e) {
		console.error('Failed to validate authorization code', e);
		return new Response('Failed to validate authorization code', { status: 500 });
	}
	console.log('Tokens:', tokens);

	const githubAccessToken = tokens.accessToken();

	console.log('Access token:', githubAccessToken);

	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${githubAccessToken}`
		}
	});
	console.log('Response status:', response.status);
	const user = await response.json();
	console.log('User data:', user);

	event.cookies.set(
		'github_access_token',
		JSON.stringify({ token: githubAccessToken, name: user.login, url: user.url }),
		{
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 365,
			secure: import.meta.env.PROD,
			path: '/',
			sameSite: 'lax'
		}
	);

	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
