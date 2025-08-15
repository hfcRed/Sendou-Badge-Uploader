import { encode } from '@jsquash/avif';
import { PICO_COLORS } from './picocad/pico';

export function isPico8Texture(data: ImageData) {
	const colors = new Set(PICO_COLORS.map(([r, g, b]) => rgbToInt(r, g, b)));

	const ints = new Int32Array(data.data.buffer);

	for (let i = 0, n = ints.length; i < n; i++) {
		const int = ints[i];
		if (!colors.has(int)) {
			return false;
		}
	}

	return true;
}

export function isNormalMap(image: ImageData) {
	const data = image.data;
	const sampleSize = Math.min(10000, Math.floor(data.length / 4));
	const step = Math.max(1, Math.floor(data.length / 4 / sampleSize));

	let blueSum = 0;
	let totalPixels = 0;

	for (let i = 0; i < data.length; i += 4 * step) {
		const b = data[i + 2] / 255;

		blueSum += b;
		totalPixels++;
	}

	return blueSum / totalPixels > 0.6;
}

export function hexToRGB(s: string) {
	return [s.slice(1, 3), s.slice(3, 5), s.slice(5, 7)].map((s) => parseInt(s, 16) / 255);
}

export function rgbToInt(r: number, g: number, b: number) {
	return 0xff000000 | (b << 16) | (g << 8) | r;
}

export function handleInputChange(
	e: Event & {
		currentTarget: (EventTarget & HTMLInputElement) | HTMLTextAreaElement;
	}
) {
	if (!e.currentTarget.validity.valid) {
		e.currentTarget.setAttribute('aria-invalid', 'true');
	} else {
		e.currentTarget.setAttribute('aria-invalid', 'false');
	}
}

export async function createAvifLink(url: string) {
	const img = document.createElement('img');
	img.src = url;

	await new Promise((resolve) => (img.onload = resolve));

	const canvas = document.createElement('canvas');
	[canvas.width, canvas.height] = [img.width, img.height];
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(img, 0, 0);

	const data = ctx.getImageData(0, 0, img.width, img.height);
	const avifBuffer = await encode(data);
	const avifBlob = new Blob([avifBuffer], { type: 'image/avif' });

	img.remove();
	canvas.remove();

	return URL.createObjectURL(avifBlob);
}
