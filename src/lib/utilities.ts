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
