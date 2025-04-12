<script lang="ts">
	import { onMount } from 'svelte';
	import { viewer } from './viewer-state.svelte';
	import { hexToRGB } from '$lib/utilities';
	import { urlCompressModel, urlDecompressModel } from '$lib/picocad/model-compression';

	interface SavedModel {
		name: string;
		image: string;
		selected: boolean;
	}

	let savedModels = $state<SavedModel[]>([]);
	let savedSelected = $derived(savedModels.find((model) => model.selected));

	function saveToStorage() {
		const data = viewer.pico.getPixels();
		const imageData = new ImageData(new Uint8ClampedArray(data), 128, 128);

		const canvas = document.createElement('canvas');
		[canvas.width, canvas.height] = [128, 128];
		const ctx = canvas.getContext('2d')!;
		ctx.putImageData(imageData, 0, 0);
		const base64 = canvas.toDataURL('image/png');

		const json = JSON.stringify({
			...viewer.viewport,
			...viewer.shader,
			model: urlCompressModel(viewer.pico.model),
			name: viewer.pico.model.name,
			image: base64
		});

		localStorage.setItem(viewer.pico.model.name || '', json);
		canvas.remove();

		loadModelPreviews();
	}

	async function loadFromStorage() {
		const model = localStorage.getItem(savedSelected?.name || '');
		if (!model) return;

		const data = JSON.parse(model);
		await viewer.loadModel(urlDecompressModel(data.model));

		viewer.viewport = {
			...viewer.viewport,
			...Object.fromEntries(Object.entries(data).filter(([key]) => key in viewer.viewport))
		};

		viewer.shader = {
			...viewer.shader,
			...Object.fromEntries(Object.entries(data).filter(([key]) => key in viewer.shader))
		};

		viewer.pico.setWatermark(data.watermark);

		viewer.pico.renderMode = data.renderMode.toLowerCase();
		viewer.pico.shading = data.shading;
		viewer.pico.outlineSize = data.outlineWidth;
		viewer.pico.outlineColor = hexToRGB(data.outlineColor);
		viewer.pico.drawWireframe = data.wireframe;
		viewer.pico.wireframeXray = data.wireframeXray;
		viewer.pico.wireframeColor = hexToRGB(data.wireframeColor);
	}

	function deleteFromStorage() {
		if (!savedSelected) return;
		localStorage.removeItem(savedSelected.name);
		savedModels = savedModels.filter((model) => model.name !== savedSelected?.name || '');
	}

	function loadModelPreviews() {
		savedModels = [];

		const keys = Object.keys(localStorage);

		for (const key of keys) {
			const value = localStorage.getItem(key);
			if (!value) continue;

			const data = JSON.parse(value);

			savedModels.push({
				name: data.name,
				image: data.image,
				selected: false
			});
		}
	}

	onMount(() => {
		loadModelPreviews();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === 's') {
				e.preventDefault();
				saveToStorage();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="images-container">
	<fieldset class="grid">
		<button onclick={() => saveToStorage()}>Save</button>
		<button onclick={() => loadFromStorage()} disabled={!savedSelected}>Load</button>
		<button onclick={() => deleteFromStorage()} disabled={!savedSelected}>Delete</button>
	</fieldset>
	<div class="img-display">
		{#each savedModels as model, i}
			<button
				class="btn-reset model-preview"
				data-selected={model.selected}
				onclick={() => {
					savedModels.forEach((m) => (m.selected = false));
					savedModels[i].selected = true;
				}}
			>
				<small>{model.name}</small>
				<img src={model.image} alt={model.name} draggable="false" />
			</button>
		{/each}
	</div>
</div>

<style>
	.images-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		& button {
			width: 100%;
		}

		& .img-display {
			border: var(--pico-border-width) solid var(--pico-form-element-border-color);
			border-radius: var(--pico-border-radius);
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: repeat(3, 1fr);
			background-color: black;
			width: 100%;
			aspect-ratio: 1 / 1;
			scrollbar-width: thin;
			scrollbar-gutter: stable;
			overflow-y: auto;

			& button {
				border-radius: var(--pico-border-radius);
				border: 2px solid black;

				&:focus-visible,
				&[data-selected='true'] {
					border: 2px solid var(--pico-primary);
				}
			}
		}

		& .model-preview {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			margin-bottom: 0.5rem;
			padding: 0.25rem;

			& img {
				scale: 1 -1;
			}

			& small {
				background-color: var(--pico-form-element-background-color);
				border-radius: var(--pico-border-radius);
				margin: 0;
				padding: 0.1rem 0.25rem;
				text-overflow: ellipsis;
				text-wrap: nowrap;
				overflow: hidden;
			}
		}

		& img {
			border-radius: var(--pico-border-radius);
			width: 100%;
			height: 100%;
		}
	}
</style>
