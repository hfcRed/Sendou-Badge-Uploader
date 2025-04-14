import example from '$lib/picocad/files/example-model.txt?raw';
import defaultLightmap from '$lib/picocad/files/default-lightmap.png';
import { PicoCADViewer, type PicoCADRenderMode, type PicoCADSource } from '$lib/picocad';
import { isPico8Texture, hexToRGB } from '$lib/utilities';

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

interface ViewerSettings {
	name: string;
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
	renderMode: string;
	shading: boolean;
	outlineWidth: number;
	outlineColor: string;
	wireframe: boolean;
	wireframeXray: boolean;
	wireframeColor: string;
	usingHDTexture: boolean;
	hdShadingSteps: number;
	hdShadingColor: string;
}

export class Viewer {
	viewport = $state({
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

	shader = $state({
		renderMode: 'Texture',
		shading: true,
		outlineWidth: 0,
		outlineColor: '#ffffff',
		wireframe: false,
		wireframeXray: true,
		wireframeColor: '#ffffff',
		usingHDTexture: false,
		hdShadingSteps: 3,
		hdShadingColor: '#000000'
	});

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

	modelName = $state('');

	private textureCanvas = $state<CanvasRenderingContext2D>()!;
	private lightmapCanvas = $state<CanvasRenderingContext2D>()!;

	private worker!: Worker;
	workerLoaded = $state(false);

	private eventHandlers: Record<string, EventListenerOrEventListenerObject> | null = null;

	pico!: PicoCADViewer;

	async init(
		viewportCanvas: HTMLCanvasElement,
		textureCanvas: HTMLCanvasElement,
		lightmapCanvas: HTMLCanvasElement
	) {
		this.textureCanvas = textureCanvas.getContext('2d')!;
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

		const img = new Image();
		img.src = defaultLightmap;
		img.onload = () => this.lightmapCanvas.drawImage(img, 0, 0);

		this.pico.startDrawLoop(this.drawLoop.bind(this));

		this.setupWorker();
		this.addEventListeners();
	}

	async loadModel(source: PicoCADSource) {
		await this.pico.load(source);

		this.modelName = this.pico.model.name || 'untitled';

		this.shader.usingHDTexture = false;
		this.pico.removeHDTexture();
		this.textureCanvas.putImageData(this.pico.getModelTexture(), 0, 0);
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
		this.pico.outlineSize = data.outlineWidth;
		this.pico.outlineColor = hexToRGB(data.outlineColor);
		this.pico.drawWireframe = data.wireframe;
		this.pico.wireframeXray = data.wireframeXray;
		this.pico.wireframeColor = hexToRGB(data.wireframeColor);
		this.pico.hdOptions.shadingSteps = data.hdShadingSteps;
		this.pico.hdOptions.shadingColor = hexToRGB(data.hdShadingColor);
	}

	private drawLoop(delta: number) {
		if (this.viewport.turntable) {
			if (this.gif.recording) {
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
		const maxTime = 10;
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
				palette: this.pico.hasHDTexture() ? null : this.pico.getPalette(),
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

		const isPico8 = isPico8Texture(data);
		const isLightmap = data.width === 32 && data.height === 7;

		if (isLightmap) {
			this.pico.setLightMap(data);
			this.lightmapCanvas.putImageData(data, 0, 0);
			return;
		}

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
			}) as EventListener
		};

		window.addEventListener('dragenter', this.eventHandlers.dragenter as EventListener);
		window.addEventListener('dragleave', this.eventHandlers.dragleave as EventListener);
		window.addEventListener('dragover', this.eventHandlers.dragover as EventListener);
		window.addEventListener('drop', this.eventHandlers.drop as EventListener);
		window.addEventListener('paste', this.eventHandlers.paste as EventListener);
		window.addEventListener('keydown', this.eventHandlers.keydown as EventListener);
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
	}
}

export const viewer = new Viewer();
