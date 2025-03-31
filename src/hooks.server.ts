import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const authHandle: Handle = async ({ event, resolve }) => {
	const login = event.cookies.get('github_access_token');

	if (login) {
		const data = JSON.parse(login);

		event.locals.user = {
			token: data.token,
			name: data.name,
			url: data.url
		};
	}

	return resolve(event);
};

export const handle = sequence(authHandle);
