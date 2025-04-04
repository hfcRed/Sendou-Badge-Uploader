import * as v from 'valibot';
import { FormSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return {
			loggedIn: true,
			name: locals.user.name,
			url: locals.user.url
		};
	}

	return {
		loggedIn: false
	};
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const result = v.safeParse(FormSchema, Object.fromEntries(formData.entries()));

		if (!result.success) {
			return {
				success: false,
				message: 'Validation failed, did you fill out all required fields correctly?'
			};
		}
	}
} satisfies Actions;
