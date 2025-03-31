import type { Login } from '$lib/server/github';
declare global {
	namespace App {
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			user: Login;
		}
	}
}

export {};
