import type { GithubLogin } from '$lib/server/github/constants';

declare global {
	namespace App {
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			user: GithubLogin;
		}
	}
}

export {};
