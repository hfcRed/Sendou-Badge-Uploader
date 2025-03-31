import type { RequestEvent } from '../$types';

export function GET(event: RequestEvent) {
	event.cookies.delete('github_access_token', {
		path: '/'
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
