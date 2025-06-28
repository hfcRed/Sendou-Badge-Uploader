export interface Gif {
	url: string | null;
	recording: boolean;
	time: number;
	progress: number;
	initialRotation: number;
}

export interface GeneratedImage {
	url: string | null;
	selected: boolean;
}

export interface Images {
	generating: boolean;
	progress: number;
	generated: GeneratedImage[];
}

export interface ViewportSettings {
	cameraDistance: number;
	cameraHeight: number;
	cameraTilt: number;
	cameraRotation: number;
	turntable: boolean;
	turntableSpeed: number;
	rulers: boolean;
	rotationOverlay: boolean;
	watermark: string;
	isCentered: boolean;
}

export interface ShaderSettings {
	renderMode: string;
	shading: boolean;
	usingHDTexture: boolean;
	hdOptions: {
		shadingSteps: number;
		shadingColor: string;
		normalMapStrength: number;
		specular: {
			enabled: boolean;
			strength: number;
			smoothness: number;
			color: string;
		};
	};
	outlineA: {
		enabled: boolean;
		size: number;
		colorFrom: string;
		colorTo: string;
		gradient: number;
		gradientDirection: number;
	};
	outlineB: {
		enabled: boolean;
		size: number;
		colorFrom: string;
		colorTo: string;
		gradient: number;
		gradientDirection: number;
	};
	wireframe: {
		enabled: boolean;
		xray: boolean;
		color: string;
	};
	chromaticAberration: {
		enabled: boolean;
		strength: number;
		redOffset: number;
		greenOffset: number;
		blueOffset: number;
		radialFalloff: number;
		centerX: number;
		centerY: number;
	};
	colorGrading: {
		enabled: boolean;
		brightness: number;
		contrast: number;
		saturation: number;
		hue: number;
	};
	posterize: {
		enabled: boolean;
		levels: number;
		channelLevels: [number, number, number];
		gamma: number;
		colorBanding: boolean;
	};
	noise: {
		enabled: boolean;
		amount: number;
	};
	bloom: {
		enabled: boolean;
		threshold: number;
		intensity: number;
		blur: number;
	};
	dither: {
		enabled: boolean;
		amount: number;
		blend: number;
		channelAmount: [number, number, number];
	};
	crt: {
		enabled: boolean;
		curvature: number;
		scanlineIntensity: number;
	};
	pixelate: {
		enabled: boolean;
		pixelSize: number;
		shape: string;
		blend: number;
	};
	lensDistortion: {
		enabled: boolean;
		strength: number;
		zoom: number;
	};
	floorReflection: {
		enabled: boolean;
		opacity: number;
		height: number;
		fadeDistance: number;
		color: string;
	};
}

export type ViewerSettings = ViewportSettings & ShaderSettings & { name: string };
