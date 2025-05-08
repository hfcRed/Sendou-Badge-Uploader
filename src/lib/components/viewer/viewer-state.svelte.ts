import example from '$lib/picocad/files/example-model.txt?raw';
import defaultNormalmap from '$lib/picocad/files/default-normalmap.png';
import defaultLightmap from '$lib/picocad/files/default-lightmap.png';
import { PicoCADViewer, type PicoCADRenderMode, type PicoCADSource } from '$lib/picocad';
import { isNormalMap, isPico8Texture, hexToRGB } from '$lib/utilities';

interface Gif {
	url: string | null;
	recording: boolean;
	time: number;
	progress: number;
	initialRotation: number;
}

interface GeneratedImage {
	url: string | null;
	selected: boolean;
}

interface Images {
	generating: boolean;
	progress: number;
	generated: GeneratedImage[];
}

interface ViewportSettings {
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

interface ShaderSettings {
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

type ViewerSettings = ViewportSettings & ShaderSettings & { name: string };

export class Viewer {
	viewport = $state<ViewportSettings>({
		cameraDistance: 7,
		cameraHeight: 1,
		cameraTilt: 0.1,
		cameraRotation: 0,
		turntable: true,
		turntableSpeed: 1,
		rulers: false,
		rotationOverlay: false,
		watermark: '',
		isCentered: true
	});

	shader = $state<ShaderSettings>({
		renderMode: 'Texture',
		shading: true,
		usingHDTexture: false,
		hdOptions: {
			shadingSteps: 4,
			shadingColor: '#000000',
			normalMapStrength: 0.5,
			specular: {
				enabled: false,
				strength: 0,
				smoothness: 10,
				color: '#ffffff'
			}
		},
		outlineA: {
			enabled: false,
			size: 0,
			colorFrom: '#ffffff',
			colorTo: '#ffffff',
			gradient: 0,
			gradientDirection: 0
		},
		outlineB: {
			enabled: false,
			size: 0,
			colorFrom: '#ffffff',
			colorTo: '#ffffff',
			gradient: 0,
			gradientDirection: 0
		},
		wireframe: {
			enabled: false,
			xray: false,
			color: '#ffffff'
		},
		chromaticAberration: {
			enabled: false,
			strength: 0,
			redOffset: 1,
			greenOffset: 0,
			blueOffset: -1,
			radialFalloff: 1.5,
			centerX: 0,
			centerY: 0
		},
		colorGrading: {
			enabled: false,
			brightness: 1.0,
			contrast: 1.0,
			saturation: 1.0,
			hue: 1.0
		},
		posterize: {
			enabled: false,
			levels: 4,
			channelLevels: [1, 1, 1],
			gamma: 1.0,
			colorBanding: false
		},
		noise: {
			enabled: false,
			amount: 0.05
		},
		bloom: {
			enabled: false,
			threshold: 0.7,
			intensity: 0.5,
			blur: 1.0
		},
		dither: {
			enabled: false,
			amount: 0.5,
			blend: 1.0,
			channelAmount: [1, 1, 1]
		},
		crt: {
			enabled: false,
			curvature: 0.5,
			scanlineIntensity: 0.3
		},
		pixelate: {
			enabled: false,
			pixelSize: 1,
			shape: 'square',
			blend: 1.0
		},
		lensDistortion: {
			enabled: false,
			strength: 1.0,
			zoom: 2.0
		},
		floorReflection: {
			enabled: false,
			opacity: 0.5,
			height: 0.0,
			fadeDistance: 1.0,
			color: '#ffffff'
		}
	});

	modelName = $state('');

	gif = $state<Gif>({
		url: null,
		recording: false,
		time: 0,
		progress: 0,
		initialRotation: 0
	});

	images = $state<Images>({
		generating: false,
		progress: 0,
		generated: []
	});
	readonly selectedImage = $derived(this.images.generated.find((image) => image.selected));

	private viewportCanvas!: HTMLCanvasElement;
	private textureCanvas!: CanvasRenderingContext2D;
	private normalMapCanvas!: CanvasRenderingContext2D;
	private lightmapCanvas!: CanvasRenderingContext2D;

	private worker!: Worker;
	workerLoaded = $state(false);

	private eventHandlers: Record<string, EventListenerOrEventListenerObject> | null = null;
	private mouse = {
		x: 0,
		y: 0,
		isDragging: false,
		lastX: 0,
		lastY: 0
	};

	pico!: PicoCADViewer;

	async init(
		viewportCanvas: HTMLCanvasElement,
		textureCanvas: HTMLCanvasElement,
		normalMapCanvas: HTMLCanvasElement,
		lightmapCanvas: HTMLCanvasElement
	) {
		this.viewportCanvas = viewportCanvas;
		this.textureCanvas = textureCanvas.getContext('2d')!;
		this.normalMapCanvas = normalMapCanvas.getContext('2d')!;
		this.lightmapCanvas = lightmapCanvas.getContext('2d')!;

		this.pico?.free();
		this.pico?.stopDrawLoop();
		this.worker?.terminate();

		this.pico = new PicoCADViewer({
			canvas: viewportCanvas,
			resolution: {
				width: 128,
				height: 128,
				scale: 4
			},
			fov: 30
		});
		await this.loadModel(example);

		this.loadSettings({
			...this.viewport,
			...this.shader,
			name: this.pico.model.name || 'untitled'
		});

		this.pico.startDrawLoop(this.drawLoop.bind(this));

		this.setupWorker();
		this.addEventListeners();
	}

	async loadModel(source: PicoCADSource) {
		await this.pico.load(source);

		this.modelName = this.pico.model.name || 'untitled';
		this.shader.usingHDTexture = false;

		this.pico.removeNormalMap();
		const normal = new Image();
		normal.src = defaultNormalmap;
		normal.onload = () => this.normalMapCanvas.drawImage(normal, 0, 0);

		this.pico.resetLightMap();
		const light = new Image();
		light.src = defaultLightmap;
		light.onload = () => this.lightmapCanvas.drawImage(light, 0, 0);

		this.pico.removeHDTexture();
		this.textureCanvas.putImageData(this.pico.getModelTexture(), 0, 0);
	}

	private drawLoop(delta: number) {
		if (this.viewport.turntable) {
			if (this.gif.recording) {
				delta = 0.02;
				this.viewport.cameraRotation += delta * this.viewport.turntableSpeed;
			} else {
				this.viewport.cameraRotation = parseFloat(
					(
						(this.viewport.cameraRotation + delta * this.viewport.turntableSpeed) %
						(Math.PI * 2)
					).toFixed(3)
				);
			}
		}

		this.pico.setTurntableCamera(
			this.viewport.cameraDistance,
			this.viewport.cameraRotation,
			this.viewport.cameraTilt,
			{
				x: 0,
				y: this.viewport.cameraHeight,
				z: 0
			}
		);
		this.pico.setLightDirectionFromCamera();

		if (this.gif.recording) this.processFrame(delta);
	}

	private processFrame(delta: number) {
		const maxTime = 100;
		const delay = 0.02;
		const previous = this.gif.time;
		this.gif.time += delta;

		if (
			this.gif.time > maxTime ||
			Math.abs(this.gif.initialRotation - this.viewport.cameraRotation) >= Math.PI * 2
		) {
			this.gif.recording = false;

			this.worker.postMessage({
				type: 'generate',
				width: 128,
				height: 128,
				scale: 4,
				delay: Math.round(delay * 1000),
				background: this.pico.getRenderedBackgroundColor(),
				palette: null,
				transparentIndex: -1
			});
		} else if (
			previous === 0 ||
			Math.floor(previous / delay) !== Math.floor(this.gif.time / delay)
		) {
			const data = this.pico.getPixels();

			this.worker.postMessage(
				{
					type: 'frame',
					data
				},
				[data.buffer]
			);

			this.gif.progress = Math.floor(
				(Math.abs(this.gif.initialRotation - this.viewport.cameraRotation) / (Math.PI * 2)) * 100
			);
		}
	}

	startGifRecording() {
		this.viewport.turntable = true;
		this.gif = {
			url: '',
			recording: true,
			time: 0,
			progress: 0,
			initialRotation: this.viewport.cameraRotation
		};
	}

	private setupWorker() {
		this.workerLoaded = false;
		this.worker = new Worker(new URL('$lib/picocad/worker/index.js', import.meta.url).href, {
			type: 'module'
		});
		this.worker.onmessage = (e) => {
			if (e.data.type === 'load') {
				this.workerLoaded = true;
			}

			if (e.data.type === 'gif') {
				const fileName = 'test.gif';

				const file = new File([e.data.data], fileName, {
					type: 'image/gif'
				});

				this.gif.url = URL.createObjectURL(file);
			}
		};
	}

	private handleFile(file: File) {
		const extension = file.name.split('.').pop()?.toLowerCase();

		if (extension === 'txt') this.loadModel(file);
		if (['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'].includes(extension!)) this.loadImage(file);
	}

	private async loadImage(file: File) {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.src = url;
		await new Promise((resolve) => (img.onload = resolve));

		const canvas = document.createElement('canvas');
		[canvas.width, canvas.height] = [img.naturalWidth, img.naturalHeight];
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0);
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

		const isLightmap = data.width === 32 && data.height === 7;
		const isNormal = isNormalMap(data);
		const isPico8 = isPico8Texture(data);

		if (isLightmap) {
			this.pico.setLightMap(data);
			this.lightmapCanvas.putImageData(data, 0, 0);
			return;
		}

		if (isNormal) {
			this.pico.setNormalMap(data);
			this.normalMapCanvas.canvas.width = data.width;
			this.normalMapCanvas.canvas.height = data.height;
			this.normalMapCanvas.putImageData(data, 0, 0);
			return;
		}

		this.textureCanvas.canvas.width = data.width;
		this.textureCanvas.canvas.height = data.height;

		if (isPico8) {
			this.shader.usingHDTexture = false;
			this.pico.removeHDTexture();
			this.pico.setIndexTexture(data);
			this.textureCanvas.putImageData(data, 0, 0);
		} else {
			this.shader.usingHDTexture = true;
			this.pico.setHDTexture(data);
			this.textureCanvas.putImageData(data, 0, 0);
		}

		URL.revokeObjectURL(url);
		canvas.remove();
	}

	loadSettings(data: ViewerSettings) {
		this.modelName = data.name;

		this.viewport = {
			...this.viewport,
			...Object.fromEntries(Object.entries(data).filter(([key]) => key in this.viewport))
		};

		this.shader = {
			...this.shader,
			...Object.fromEntries(Object.entries(data).filter(([key]) => key in this.shader)),
			usingHDTexture: false
		};

		this.pico.setWatermark(data.watermark);

		this.pico.backgroundColor = [0, 0, 0, 1];
		this.pico.renderMode = data.renderMode.toLowerCase() as PicoCADRenderMode;
		this.pico.shading = data.shading;
		this.pico.drawWireframe = data.wireframe.enabled;
		this.pico.wireframeXray = data.wireframe.xray;
		this.pico.wireframeColor = hexToRGB(data.wireframe.color);

		this.pico.hdOptions = {
			...data.hdOptions,
			shadingColor: hexToRGB(data.hdOptions.shadingColor),
			specular: {
				...data.hdOptions.specular,
				color: hexToRGB(data.hdOptions.specular.color)
			}
		};

		this.pico.outlineA = {
			...data.outlineA,
			colorFrom: hexToRGB(data.outlineA.colorFrom),
			colorTo: hexToRGB(data.outlineA.colorTo)
		};

		this.pico.outlineB = {
			...data.outlineB,
			colorFrom: hexToRGB(data.outlineB.colorFrom),
			colorTo: hexToRGB(data.outlineB.colorTo)
		};

		this.pico.chromaticAberration = { ...data.chromaticAberration };
		this.pico.colorGrading = { ...data.colorGrading };
		this.pico.posterize = { ...data.posterize };
		this.pico.noise = { ...data.noise };
		this.pico.bloom = { ...data.bloom };
		this.pico.dither = {
			...data.dither,
			channelAmount: data.dither.channelAmount ?? [1, 1, 1]
		};
		this.pico.crt = { ...data.crt };
		this.pico.pixelate = {
			...data.pixelate,
			shape: data.pixelate.shape,
			blend: data.pixelate.blend
		};
		this.pico.lensDistortion = { ...data.lensDistortion };
		this.pico.floorReflection = {
			...data.floorReflection,
			color: hexToRGB(data.floorReflection.color)
		};
	}

	private addEventListeners() {
		this.removeEventListeners();

		this.eventHandlers = {
			dragenter: (e: Event) => e.preventDefault(),
			dragleave: (e: Event) => e.preventDefault(),
			dragover: (e: Event) => e.preventDefault(),

			drop: ((e: DragEvent) => {
				e.preventDefault();

				const file = e.dataTransfer?.files[0];
				if (file) this.handleFile(file);

				const text = e.dataTransfer?.getData('text/plain');
				if (text && !file) this.loadModel(text);
			}) as EventListener,

			paste: ((e: ClipboardEvent) => {
				const file = e.clipboardData?.files[0];
				if (file) this.handleFile(file);

				const text = e.clipboardData?.getData('text/plain');
				if (text) this.loadModel(text);
			}) as EventListener,

			keydown: ((e: KeyboardEvent) => {
				if (e.ctrlKey || e.metaKey) return;
				if (e.target !== document.body) return;
				e.preventDefault();

				this.handleKeyboardInput(e.key.toLowerCase());
			}) as EventListener,

			mousemove: ((e: MouseEvent) => {
				if (!this.mouse.isDragging) return;

				const deltaX = e.clientX - this.mouse.lastX;
				const deltaY = e.clientY - this.mouse.lastY;

				this.viewport.cameraRotation = parseFloat(
					((this.viewport.cameraRotation + deltaX * 0.01) % (Math.PI * 2)).toFixed(3)
				);
				if (this.viewport.cameraRotation < 0)
					parseFloat((this.viewport.cameraRotation += Math.PI * 2).toFixed(3));

				this.viewport.cameraTilt = parseFloat(
					Math.max(Math.min(this.viewport.cameraTilt + deltaY * 0.01, 1), -1).toFixed(2)
				);

				this.mouse.lastX = e.clientX;
				this.mouse.lastY = e.clientY;
			}) as EventListener,

			mousedown: ((e: MouseEvent) => {
				e.preventDefault();

				this.mouse.isDragging = true;
				this.mouse.lastX = e.clientX;
				this.mouse.lastY = e.clientY;

				this.viewport.turntable = false;
			}) as EventListener,

			mouseup: (() => {
				this.mouse.isDragging = false;
			}) as EventListener,

			wheel: ((e: WheelEvent) => {
				e.preventDefault();

				const zoomAmount = e.deltaY * 0.001;
				this.viewport.cameraDistance = parseFloat(
					Math.max(Math.min(this.viewport.cameraDistance + zoomAmount, 100), 0).toFixed(2)
				);
			}) as EventListener
		};

		window.addEventListener('dragenter', this.eventHandlers.dragenter as EventListener);
		window.addEventListener('dragleave', this.eventHandlers.dragleave as EventListener);
		window.addEventListener('dragover', this.eventHandlers.dragover as EventListener);
		window.addEventListener('drop', this.eventHandlers.drop as EventListener);
		window.addEventListener('paste', this.eventHandlers.paste as EventListener);
		window.addEventListener('keydown', this.eventHandlers.keydown as EventListener);

		this.viewportCanvas.addEventListener(
			'mousemove',
			this.eventHandlers.mousemove as EventListener
		);
		this.viewportCanvas.addEventListener(
			'mousedown',
			this.eventHandlers.mousedown as EventListener
		);
		this.viewportCanvas.addEventListener('mouseup', this.eventHandlers.mouseup as EventListener);
		this.viewportCanvas.addEventListener('wheel', this.eventHandlers.wheel as EventListener, {
			passive: false
		});
	}

	private handleKeyboardInput(key: string) {
		if (key === 'arrowleft' || key === 'a') {
			this.viewport.turntable = false;
			this.viewport.cameraRotation = (this.viewport.cameraRotation - 0.05) % (Math.PI * 2);
			if (this.viewport.cameraRotation < 0) this.viewport.cameraRotation += Math.PI * 2;
		}
		if (key === 'arrowright' || key === 'd') {
			this.viewport.turntable = false;
			this.viewport.cameraRotation = (this.viewport.cameraRotation + 0.05) % (Math.PI * 2);
		}

		if (key === 'arrowup' || key === 'w') {
			this.viewport.cameraTilt = Math.min(this.viewport.cameraTilt + 0.025, 1);
		}
		if (key === 'arrowdown' || key === 's') {
			this.viewport.cameraTilt = Math.max(this.viewport.cameraTilt - 0.025, -1);
		}

		if (key === 'home' || key === 'e') {
			this.viewport.cameraDistance = Math.max(this.viewport.cameraDistance - 0.5, 0);
		}
		if (key === 'end' || key === 'q') {
			this.viewport.cameraDistance = Math.min(this.viewport.cameraDistance + 0.5, 100);
		}

		if (key === 'y' || key === 'z' || key === 'pagedown') {
			this.viewport.cameraHeight = Math.min(this.viewport.cameraHeight + 0.05, 10);
		}
		if (key === 'x' || key === 'pageup') {
			this.viewport.cameraHeight = Math.max(this.viewport.cameraHeight - 0.05, -10);
		}

		if (key === 't' || key === ' ') {
			this.viewport.turntable = !this.viewport.turntable;
		}
		if (key === 'r') {
			this.viewport.rulers = !this.viewport.rulers;
		}
		if (key === 'o') {
			this.viewport.rotationOverlay = !this.viewport.rotationOverlay;
		}
	}

	private removeEventListeners() {
		if (!this.eventHandlers) return;

		window.removeEventListener('dragenter', this.eventHandlers.dragenter as EventListener);
		window.removeEventListener('dragleave', this.eventHandlers.dragleave as EventListener);
		window.removeEventListener('dragover', this.eventHandlers.dragover as EventListener);
		window.removeEventListener('drop', this.eventHandlers.drop as EventListener);
		window.removeEventListener('paste', this.eventHandlers.paste as EventListener);
		window.removeEventListener('keydown', this.eventHandlers.keydown as EventListener);

		window.removeEventListener('mousemove', this.eventHandlers.mousemove as EventListener);
		this.viewportCanvas.removeEventListener(
			'mousedown',
			this.eventHandlers.mousedown as EventListener
		);
		window.removeEventListener('mouseup', this.eventHandlers.mouseup as EventListener);
		this.viewportCanvas.removeEventListener('wheel', this.eventHandlers.wheel as EventListener);
	}
}

export const viewer = new Viewer();
