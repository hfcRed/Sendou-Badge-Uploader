import type { RequestHandler } from './$types';
import { githubClient } from '$lib/server/github/constants';
import { createGitHubHeaders, getUserData } from '$lib/server/github/helpers';

export const GET: RequestHandler = async ({ cookies, url }) => {
	try {
		const storedState = cookies.get('github_auth_state') ?? null;
		const code = url.searchParams.get('code') ?? null;
		const state = url.searchParams.get('state') ?? null;

		if (!storedState || !code || !state) {
			return new Response('Missing authentication parameters', { status: 400 });
		}
		if (storedState !== state) {
			return new Response('Invalid state parameter', { status: 403 });
		}

		const tokens = await githubClient.validateAuthorizationCode(code);
		const githubAccessToken = tokens.accessToken();

		const headers = createGitHubHeaders(githubAccessToken);
		const user = await getUserData(headers);

		if (!user.login) {
			return new Response('Failed to fetch user data', { status: 500 });
		}

		cookies.set(
			'github_access_token',
			JSON.stringify({ token: githubAccessToken, name: user.login, url: user.html_url }),
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
	} catch (error) {
		console.error('Error during GitHub authentication:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
};
