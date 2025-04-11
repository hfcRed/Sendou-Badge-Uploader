import example from '$lib/picocad/files/example-model.txt?raw';
import defaultLightmap from '$lib/picocad/files/default-lightmap.png';
import { PicoCADViewer, type PicoCADSource } from '$lib/picocad';
import { isPico8Texture } from '$lib/utilities';

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

export class Viewer {
	viewport = $state({
		cameraDistance: 30,
		cameraHeight: 0,
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
		wireframeColor: '#ffffff'
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

	private textureCanvas = $state<CanvasRenderingContext2D>()!;
	private lightmapCanvas = $state<CanvasRenderingContext2D>()!;

	private worker!: Worker;
	workerLoaded = $state(false);

	pico!: PicoCADViewer;

	init(
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
		this.pico.backgroundColor = [0, 0, 0, 1];
		this.pico.outlineColor = [1, 1, 1, 1];
		this.loadModel(example);

		const img = new Image();
		img.src = defaultLightmap;
		img.onload = () => this.lightmapCanvas.drawImage(img, 0, 0);

		this.pico.startDrawLoop(this.drawLoop.bind(this));

		this.setupWorker();
		this.setupEvents();
	}

	async loadModel(source: PicoCADSource) {
		const model = await this.pico.load(source);
		this.viewport.cameraDistance = model.zoomLevel!;

		const center = this.getModelCenter();
		this.viewport.cameraHeight = center.y;

		this.textureCanvas.putImageData(this.pico.getModelTexture(), 0, 0);
		this.pico.removeHDTexture();
	}

	private getModelCenter() {
		const objects = this.pico.model.objects;
		const min = [Infinity, Infinity, Infinity];
		const max = [-Infinity, -Infinity, -Infinity];

		for (const object of objects) {
			for (const vertex of object.vertices) {
				for (let i = 0; i < 3; i++) {
					const value = vertex[i] + object.position[i];
					min[i] = Math.min(min[i], value);
					max[i] = Math.max(max[i], value);
				}
			}
		}

		const centerX = (min[0] + max[0]) / 2;
		const centerY = -((min[1] + max[1]) / 2);
		const centerZ = (min[2] + max[2]) / 2;

		this.viewport.isCentered = Math.abs(centerX) <= 0.2 && Math.abs(centerZ) <= 0.2;

		return {
			x: 0,
			y: centerY,
			z: 0
		};
	}

	private drawLoop(delta: number) {
		if (this.viewport.turntable)
			this.viewport.cameraRotation += delta * this.viewport.turntableSpeed;

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

	private setupEvents() {
		window.addEventListener('dragenter', (e) => e.preventDefault());
		window.addEventListener('dragleave', (e) => e.preventDefault());
		window.addEventListener('dragover', (e) => e.preventDefault());
		window.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault();

			const file = e.dataTransfer?.files[0];
			if (file) this.handleFile(file);

			const text = e.dataTransfer?.getData('text/plain');
			if (text && !file) this.loadModel(text);
		});

		window.addEventListener('paste', (e: ClipboardEvent) => {
			const file = e.clipboardData?.files[0];
			if (file) this.handleFile(file);

			const text = e.clipboardData?.getData('text/plain');
			if (text) this.loadModel(text);
		});
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
			this.pico.removeHDTexture();
			this.pico.setIndexTexture(data);
			this.textureCanvas.putImageData(data, 0, 0);
		} else {
			this.pico.setHDTexture(data);
			this.textureCanvas.putImageData(data, 0, 0);
		}

		URL.revokeObjectURL(url);
		canvas.remove();
	}
}

export const viewer = new Viewer();
