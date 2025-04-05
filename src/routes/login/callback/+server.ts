import { github } from '$lib/server/github';
import type { OAuth2Tokens } from 'arctic';
import type { RequestEvent } from './$types';

export async function GET(event: RequestEvent) {
	const storedState = event.cookies.get('github_auth_state') ?? null;
	const code = event.url.searchParams.get('code') ?? null;
	const state = event.url.searchParams.get('state') ?? null;

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

	const githubAccessToken = tokens.accessToken();

	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${githubAccessToken}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json',
			'User-Agent': 'Badge Uploader'
		}
	});
	const user = await response.json();

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
