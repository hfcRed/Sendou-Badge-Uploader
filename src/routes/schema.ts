import * as v from 'valibot';

export const FormSchema = v.object({
	cameraDistance: v.pipe(v.string(), v.transform(Number), v.minValue(0), v.maxValue(100)),
	watermark: v.pipe(v.string(), v.minLength(0), v.maxLength(100), v.trim()),
	renderMode: v.picklist(['Texture', 'Color']),
	shading: v.optional(v.string()),
	outlineWidth: v.pipe(v.string(), v.transform(Number), v.minValue(0), v.maxValue(25)),
	outlineColor: v.optional(v.pipe(v.string(), v.hexColor())),
	wireframe: v.optional(v.string()),
	wireframeXray: v.optional(v.string()),
	wireframeColor: v.optional(v.pipe(v.string(), v.hexColor())),
	creator: v.pipe(
		v.string(),
		v.nonEmpty(),
		v.minLength(22),
		v.maxLength(50),
		v.trim(),
		v.url(),
		v.startsWith('https://sendou.ink/u/')
	),
	displayName: v.pipe(v.string(), v.nonEmpty(), v.minLength(1), v.maxLength(50), v.trim()),
	shorthandName: v.pipe(
		v.string(),
		v.nonEmpty(),
		v.minLength(1),
		v.maxLength(50),
		v.trim(),
		v.regex(/^[a-zA-Z0-9]+$/)
	),
	notes: v.pipe(v.string(), v.minLength(0), v.maxLength(500), v.trim()),
	gif: v.file(),
	png: v.file(),
	avif: v.file()
});

export type Form = v.InferInput<typeof FormSchema>;
