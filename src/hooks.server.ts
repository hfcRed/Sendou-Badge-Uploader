import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateAccessToken } from '$lib/server/github/helpers';

const authHandle: Handle = async ({ event, resolve }) => {
	const login = event.cookies.get('github_access_token');

	if (login) {
		const data = JSON.parse(login);

		const validation = await validateAccessToken(data.token);
		if (!validation) {
			event.cookies.delete('github_access_token', {
				path: '/'
			});

			return resolve(event);
		}

		event.locals.user = {
			token: data.token,
			name: data.name,
			url: data.url
		};
	}

	return resolve(event);
};

export const handle = sequence(authHandle);
