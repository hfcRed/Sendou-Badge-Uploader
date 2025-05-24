import * as v from 'valibot';
import { fail, type ActionFailure } from '@sveltejs/kit';
import { CreateSchema, UpdateSchema } from './schema';

export interface ValidationError extends Record<string, unknown> {
	success: false;
	for: 'create' | 'update';
	message: string;
}

export type ValidationResult<T> =
	| { success: true; output: T }
	| { success: false; error: ActionFailure<ValidationError> };

export interface CreateRequestOutput {
	shorthandName: string;
	displayName: string;
	creator: string;
	notes?: string;
	gif: File;
	png: File;
	avif: File;
}

export interface UpdateRequestOutput extends CreateRequestOutput {
	updateType: 'existing' | 'new';
	updateName?: string;
	prUrl: string;
}

export async function validateCreateRequest(
	request: Request
): Promise<ValidationResult<CreateRequestOutput>> {
	const formData = await request.formData();
	const result = v.safeParse(CreateSchema, Object.fromEntries(formData.entries()));

	if (!result.success) {
		return {
			success: false,
			error: fail(400, {
				success: false,
				for: 'create',
				message: 'Validation failed, did you fill out all required fields correctly?'
			})
		};
	}

	if (!validateFileNames(result.output)) {
		return {
			success: false,
			error: fail(400, {
				success: false,
				for: 'create',
				message: 'File names must match the badge shorthand name!'
			})
		};
	}

	return { success: true, output: result.output };
}

export async function validateUpdateRequest(
	request: Request
): Promise<ValidationResult<UpdateRequestOutput>> {
	const formData = await request.formData();
	const result = v.safeParse(UpdateSchema, Object.fromEntries(formData.entries()));

	if (!result.success) {
		return {
			success: false,
			error: fail(400, {
				success: false,
				for: 'update',
				message: 'Validation failed, did you fill out all required fields correctly?'
			})
		};
	}

	if (result.output.updateType === 'existing' && !result.output.updateName) {
		return {
			success: false,
			error: fail(400, {
				success: false,
				for: 'update',
				message: 'Please provide the name of the badge you want to update!'
			})
		};
	}

	if (!validateFileNames(result.output)) {
		return {
			success: false,
			error: fail(400, {
				success: false,
				for: 'update',
				message: 'File names must match the badge shorthand name!'
			})
		};
	}

	return { success: true, output: result.output };
}

export function validateFileNames(data: {
	shorthandName: string;
	gif: File;
	png: File;
	avif: File;
}) {
	const shortName = data.shorthandName;
	return (
		data.gif.name === `${shortName}.gif` &&
		data.png.name === `${shortName}.png` &&
		data.avif.name === `${shortName}.avif`
	);
}

export function checkUserAuthentication(locals: App.Locals): ValidationResult<App.Locals['user']> {
	if (!locals.user) {
		return {
			success: false,
			error: fail(401, {
				success: false,
				for: 'create',
				message: 'You must be logged into GitHub to open a Pull Request!'
			})
		};
	}
	return { success: true, output: locals.user };
}
