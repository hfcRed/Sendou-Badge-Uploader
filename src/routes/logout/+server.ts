import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { deleteAuthorization } from '$lib/server/github/helpers';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.user) redirect(302, '/');

	try {
		const deleted = await deleteAuthorization(locals.user.token);
		if (!deleted) {
			return new Response('Failed to delete authorization', { status: 500 });
		}

		cookies.delete('github_access_token', {
			path: '/'
		});

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
