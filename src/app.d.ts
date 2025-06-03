import type { GithubLogin } from '$lib/server/github/constants';

declare global {
	namespace App {
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		interface Locals {
			user: GithubLogin;
		}
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
