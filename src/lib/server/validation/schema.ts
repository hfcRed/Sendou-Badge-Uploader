import * as v from 'valibot';

export const CreateSchema = v.object({
	creator: v.pipe(
		v.string(),
		v.nonEmpty(),
		v.minLength(22),
		v.maxLength(50),
		v.trim(),
		v.url(),
		v.startsWith('https://sendou.ink/u/')
	),
	displayName: v.pipe(v.string(), v.nonEmpty(), v.minLength(5), v.maxLength(50), v.trim()),
	shorthandName: v.pipe(
		v.string(),
		v.nonEmpty(),
		v.minLength(5),
		v.maxLength(50),
		v.trim(),
		v.toLowerCase(),
		v.regex(/^[a-zA-Z0-9]+$/)
	),
	notes: v.optional(v.pipe(v.string(), v.minLength(0), v.maxLength(500), v.trim())),
	gif: v.file(),
	png: v.file(),
	avif: v.file()
});

const UpdateBaseSchema = v.object({
	...CreateSchema.entries,
	prUrl: v.pipe(
		v.string(),
		v.nonEmpty(),
		v.minLength(43),
		v.maxLength(50),
		v.trim(),
		v.url(),
		v.startsWith('https://github.com/')
	)
});

export const UpdateSchema = v.variant('updateType', [
	v.object({
		...UpdateBaseSchema.entries,
		updateType: v.literal('existing'),
		updateName: v.pipe(
			v.string(),
			v.nonEmpty(),
			v.minLength(5),
			v.maxLength(50),
			v.trim(),
			v.toLowerCase(),
			v.regex(/^[a-zA-Z0-9]+$/)
		)
	}),
	v.object({
		...UpdateBaseSchema.entries,
		updateType: v.literal('new')
	})
]);
