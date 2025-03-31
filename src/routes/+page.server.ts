import * as v from 'valibot';
import { FormSchema } from './schema';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const result = v.safeParse(FormSchema, Object.fromEntries(formData.entries()));
		console.log(result);
	}
} satisfies Actions;
