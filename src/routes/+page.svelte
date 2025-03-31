<script>
	import { Tabs } from 'bits-ui';
	import PicoCADViewer from '$lib/picocad';
	import example from '$lib/picocad/shot.txt?raw';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { decode, encode } from '@jsquash/avif';

	let { data } = $props();

	let canvas;
	let viewer;

	let centered = $state(true);
	let cameraDistance = $state(30);
	let wireframe = $state(false);
	let outline = $state(false);
	let workerLoaded = $state(false);

	let loadingGif = $state(false);
	let loadingImages = $state(false);

	let gifTime = 0;
	let cameraSpin = 0;
	let gifInitialSpin = 0;
	let gifProgress = $state(0);
	let imageProgress = $state(0);

	let gif = $state(null);
	let frames = $state([]);
	let selectedFrame = $derived.by(() => frames.find((f) => f.selected));
	let frameBuffers = [];

	onMount(() => {
		viewer = new PicoCADViewer({
			canvas
		});

		viewer.load(example);
		viewer.backgroundColor = [0, 0, 0];
		viewer.outlineColor = [1, 1, 1, 1];
		viewer.setResolution(128, 128, 4);
		viewer.cameraFOV = 30;

		const center = getModelCenter(viewer);

		let worker = new Worker(new URL('$lib/picocad/worker/index.js', import.meta.url).href, {
			type: 'module'
		});

		worker.onmessage = (e) => {
			if (e.data.type === 'load') {
				workerLoaded = true;
			}

			if (e.data.type === 'gif') {
				const fileName = 'test.gif';

				const file = new File([e.data.data], fileName, {
					type: 'image/gif'
				});

				gif = URL.createObjectURL(file);
			}
		};

		viewer.startDrawLoop((dt) => {
			cameraSpin += dt * 10;
			viewer.setTurntableCamera(cameraDistance, cameraSpin, 0.1, center);
			viewer.setLightDirectionFromCamera();

			if (loadingGif) {
				const gifMaxTime = 30;
				// Frametime / 1000, so 60 fps = 0.0166666666666667
				const gifDelay = 0.02;
				const prev = gifTime;
				gifTime += dt;

				if (gifTime > gifMaxTime || Math.abs(gifInitialSpin - cameraSpin) >= Math.PI * 2) {
					loadingGif = false;

					const resolution = viewer.getResolution();
					const background = viewer.getRenderedBackgroundColor();
					let palette = null;
					let transparentIndex = -1;

					if (!viewer.hasHDTexture()) {
						palette = viewer.getPalette();

						if (palette.length > 256) {
							palette = null;
						} else {
							if (viewer.backgroundColor != null && viewer.backgroundColor[3] < 1) {
								transparentIndex = palette.length - 1;
							}
						}
					}

					worker.postMessage({
						type: 'generate',
						width: resolution.width,
						height: resolution.height,
						scale: resolution.scale,
						delay: Math.round(gifDelay * 1000),
						background,
						palette,
						transparentIndex
					});
				} else if (prev === 0 || Math.floor(prev / gifDelay) !== Math.floor(gifTime / gifDelay)) {
					const data = viewer.getPixels();

					worker.postMessage(
						{
							type: 'frame',
							data
						},
						[data.buffer]
					);

					const newData = viewer.getPixels();
					frameBuffers.push(newData.buffer);

					gifProgress = Math.floor((Math.abs(gifInitialSpin - cameraSpin) / (Math.PI * 2)) * 100);
				}
			}
		});
	});

	function startGifRecording() {
		loadingGif = true;
		gifTime = 0;
		gifInitialSpin = cameraSpin;

		URL.revokeObjectURL(gif);
		gif = null;

		frames.forEach((frame) => {
			URL.revokeObjectURL(frame.url);
		});
		frames = [];
		frameBuffers = [];
	}

	async function splitGifIntoImages() {
		loadingImages = true;

		frames.forEach((frame) => {
			URL.revokeObjectURL(frame.url);
		});
		frames = [];

		const tempCanvas = document.createElement('canvas');
		const ctx = tempCanvas.getContext('2d');
		tempCanvas.width = 128;
		tempCanvas.height = 128;

		const outputCanvas = document.createElement('canvas');
		const outputCtx = outputCanvas.getContext('2d');
		outputCanvas.width = 512;
		outputCanvas.height = 512;

		const totalFrames = frameBuffers.length;

		for (let i = 0; i < frameBuffers.length; i++) {
			const buffer = frameBuffers[i];

			imageProgress = Math.floor((i / totalFrames) * 100);

			await new Promise((resolve) => {
				setTimeout(() => {
					const imageData = new ImageData(new Uint8ClampedArray(buffer), 128, 128);

					ctx.putImageData(imageData, 0, 0);

					const flippedCanvas = document.createElement('canvas');
					const flippedCtx = flippedCanvas.getContext('2d');
					flippedCanvas.width = 128;
					flippedCanvas.height = 128;

					flippedCtx.translate(0, 128);
					flippedCtx.scale(1, -1);
					flippedCtx.drawImage(tempCanvas, 0, 0);

					outputCtx.fillStyle = 'black';
					outputCtx.fillRect(0, 0, 512, 512);
					outputCtx.imageSmoothingEnabled = false;
					outputCtx.drawImage(flippedCanvas, 0, 0, 512, 512);

					outputCanvas.toBlob((blob) => {
						const blobUrl = URL.createObjectURL(blob);

						const frame = {
							url: blobUrl,
							selected: false
						};

						frames.push(frame);
						resolve();
					}, 'image/png');

					resolve();
				}, 0);
			});
		}

		loadingImages = false;
	}

	function hexToRGB(s) {
		return [s.slice(1, 3), s.slice(3, 5), s.slice(5, 7)].map((s) => parseInt(s, 16) / 255);
	}

	function getModelCenter(viewer) {
		const objects = viewer.model.objects;
		const positions = objects.map((o) => o.position);
		const vertices = objects.map((o) => o.vertices);
		const min = [Infinity, Infinity, Infinity];
		const max = [-Infinity, -Infinity, -Infinity];
		const center = { x: 0, y: 0, z: 0 };

		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			const position = positions[i];
			const vertices = object.vertices;

			for (let j = 0; j < vertices.length; j++) {
				const vertex = vertices[j];
				const x = vertex[0] + position[0];
				const y = vertex[1] + position[1];
				const z = vertex[2] + position[2];

				min[0] = Math.min(min[0], x);
				min[1] = Math.min(min[1], y);
				min[2] = Math.min(min[2], z);
				max[0] = Math.max(max[0], x);
				max[1] = Math.max(max[1], y);
				max[2] = Math.max(max[2], z);
			}
		}

		center.x = (min[0] + max[0]) / 2;
		center.y = -((min[1] + max[1]) / 2);
		center.z = (min[2] + max[2]) / 2;

		if (Math.abs(center.x) > 0.2 || Math.abs(center.z) > 0.2) {
			centered = false;
		} else {
			centered = true;
		}

		return {
			x: 0,
			y: center.y,
			z: 0
		};
	}

	function handleInputChange(e) {
		if (!e.target.validity.valid) {
			e.target.setAttribute('aria-invalid', true);
		} else {
			e.target.setAttribute('aria-invalid', false);
		}
	}

	async function onsubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const gifResponse = await fetch(gif);
		const gifBlob = await gifResponse.blob();
		const gifFile = new File([gifBlob], 'badge.gif', { type: 'image/gif' });
		formData.set('gif', gifFile);

		const imageResponse = await fetch(selectedFrame.url);
		const imageBlob = await imageResponse.blob();
		const imageFile = new File([imageBlob], 'badge.png', { type: 'image/png' });
		formData.set('png', imageFile);

		const img = document.createElement('img');
		img.src = selectedFrame.url;
		await new Promise((resolve) => (img.onload = resolve));
		const canvas = document.createElement('canvas');
		[canvas.width, canvas.height] = [img.width, img.height];
		const ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		const data = ctx.getImageData(0, 0, img.width, img.height);
		const avifBuffer = await encode(data);
		const avifBlob = new Blob([avifBuffer], { type: 'image/avif' });
		const avifFile = new File([avifBlob], 'badge.avif', { type: 'image/avif' });
		const avifUrl = URL.createObjectURL(avifBlob);
		console.log(avifUrl);
		formData.set('avif', avifFile);

		const response = await fetch('/', {
			method: 'POST',
			body: formData
		});

		return async ({ update }) => {
			await update();
		};
	}
</script>

<section>
	<h2>Display Settings</h2>
	<div class="grid-container">
		<div class="canvas-container">
			<canvas bind:this={canvas}></canvas>
			{#if !centered}
				<aside aria-label="warning" class="alert">
					<p>Model is not centered, this might not be intentional!</p>
				</aside>
			{/if}
		</div>
		<form id="badge" method="POST" {onsubmit}>
			<Tabs.Root orientation="horizontal" value="viewport">
				<Tabs.List>
					{#snippet child()}
						<div class="tablist-container">
							<div class="tablist">
								<Tabs.Trigger value="viewport">
									{#snippet child({ props })}
										<div class="tab">
											<button class="btn-reset" {...props}>Viewport</button>
										</div>
									{/snippet}
								</Tabs.Trigger>
								<Tabs.Trigger value="shader">
									{#snippet child({ props })}
										<div class="tab">
											<button class="btn-reset" {...props}>Shader</button>
										</div>
									{/snippet}
								</Tabs.Trigger>
								<Tabs.Trigger value="textures">
									{#snippet child({ props })}
										<div class="tab">
											<button class="btn-reset" {...props}>Textures</button>
										</div>
									{/snippet}
								</Tabs.Trigger>
							</div>
						</div>
					{/snippet}
				</Tabs.List>
				<Tabs.Content value="viewport">
					<fieldset>
						<legend>Camera</legend>
						<label>
							Camera Distance
							<input
								name="cameraDistance"
								type="range"
								min="0"
								max="100"
								step="1"
								form="badge"
								value={cameraDistance}
								oninput={() => {
									cameraDistance = parseFloat(event.target.value);
								}}
							/>
							<small>Adjust until model fits into view</small>
						</label>
					</fieldset>
					<hr />
					<label>
						Watermark
						<input
							name="watermark"
							type="text"
							min="0"
							max="25"
							form="badge"
							autocorrect="off"
							oninput={(e) => {
								viewer.setWatermark(e.target.value);
							}}
						/>
					</label>
				</Tabs.Content>
				<Tabs.Content value="shader">
					<fieldset>
						<legend>Rendering</legend>
						<label>
							Render Mode
							<select
								name="renderMode"
								value="Texture"
								onchange={(e) => (viewer.renderMode = String(e.target.value).toLowerCase())}
							>
								<option>Texture</option>
								<option>Color</option>
							</select>
						</label>
						<label>
							<input
								name="shading"
								type="checkbox"
								role="switch"
								onchange={() => {
									viewer.shading = !viewer.shading;
								}}
								checked
							/>
							Shading
						</label>
					</fieldset>
					<hr />
					<fieldset>
						<legend>Outline</legend>
						<label>
							Outline Width
							<input
								name="outlineWidth"
								type="range"
								min="0"
								max="25"
								step="1"
								value="0"
								oninput={() => {
									outline = parseFloat(event.target.value) > 0;
									viewer.outlineSize = parseFloat(event.target.value);
								}}
							/>
						</label>
						<label>
							Outline Color
							<input
								name="outlineColor"
								type="color"
								value="#ffffff"
								oninput={(e) => (viewer.outlineColor = hexToRGB(e.target.value))}
								disabled={!outline}
							/>
						</label>
					</fieldset>
					<hr />
					<fieldset>
						<legend>Wireframe</legend>
						<div role="group">
							<label>
								<input
									name="wireframe"
									type="checkbox"
									role="switch"
									onchange={() => {
										viewer.drawWireframe = wireframe = !viewer.drawWireframe;
									}}
								/>
								Wireframe
							</label>
							<label>
								<input
									name="wireframeXray"
									type="checkbox"
									role="switch"
									defaultChecked
									onchange={() => (viewer.wireframeXray = !viewer.wireframeXray)}
									disabled={!wireframe}
								/>
								Wireframe X-Ray
							</label>
						</div>
						<label>
							Wireframe Color
							<input
								name="wireframeColor"
								type="color"
								value="#ffffff"
								oninput={(e) => (viewer.wireframeColor = hexToRGB(e.target.value))}
								disabled={!wireframe}
							/>
						</label>
					</fieldset>
				</Tabs.Content>
				<Tabs.Content value="textures">
					<p>Textures</p>
				</Tabs.Content>
			</Tabs.Root>
		</form>
	</div>
</section>
<hr />
<section>
	<h2>Files and Data</h2>
	<div class="grid-container">
		<div class="gif-container">
			<button disabled={!workerLoaded || loadingGif} onclick={() => startGifRecording()}
				>{#if !loadingGif}Generate GIF{:else}{gifProgress} %{/if}</button
			>
			<div class="gif-display">
				{#if gif}
					<img src={gif} alt="badge gif" />
				{/if}
			</div>
			<small>The GIF to be displayed on the site</small>
		</div>
		<div class="images-container">
			<button disabled={!gif || loadingImages} onclick={() => splitGifIntoImages()}
				>{#if !loadingImages}Generate Images{:else}{imageProgress} %{/if}</button
			>
			<div class="img-display">
				{#if frames.length > 0}
					{#each frames as frame}
						<button
							class="btn-reset"
							data-selected={frame.selected}
							onclick={() => {
								frames.forEach((f) => (f.selected = false));
								frame.selected = true;
							}}><img src={frame.url} alt="badge" /></button
						>
					{/each}
				{/if}
			</div>
			<small>Select an image to be the thumbnail</small>
		</div>
	</div>
	<div class="flex-container">
		<label>
			Badge Creator <span class="required">*</span>
			<input
				type="url"
				name="creator"
				placeholder="https://sendou.ink/u/sendou"
				required
				minlength="22"
				maxlength="50"
				pattern="https://sendou.ink/u/.+"
				form="badge"
				autocorrect="off"
				onchange={(e) => handleInputChange(e)}
			/>
			<small>Link to the profile of the creator of the badge</small>
		</label>
		<fieldset class="grid">
			<label>
				Tournament Name <span class="required">*</span>
				<input
					type="text"
					name="displayName"
					required
					minlength="1"
					maxlength="50"
					form="badge"
					autocomplete="off"
					autocorrect="off"
					onchange={(e) => handleInputChange(e)}
				/>
				<small
					>Name of the tournament the badge was made for, which will be displayed on the site</small
				>
			</label>
			<label>
				Shorthand Name <span class="required">*</span>
				<input
					type="text"
					name="shorthandName"
					required
					minlength="1"
					maxlength="50"
					form="badge"
					autocomplete="off"
					autocorrect="off"
					pattern="^[a-zA-Z0-9]+$"
					onchange={(e) => handleInputChange(e)}
				/>
				<small
					>Short name of the badge for internal idendification. No spaces or special characters</small
				>
			</label>
		</fieldset>
		<label>
			Additional Notes
			<textarea
				name="notes"
				rows="3"
				maxlength="500"
				form="badge"
				autocomplete="off"
				autocorrect="off"
				onchange={(e) => handleInputChange(e)}
			></textarea>
		</label>
		<small class="required margin">* required</small>
	</div>
</section>
<hr />
<section>
	<h2>Upload</h2>
	{#if data.loggedIn}
		<div class="flex-container">
			<button type="submit" form="badge" disabled={!gif || !selectedFrame?.url}
				>Create Pull Request</button
			>
			<p>
				<span>Signed in as <a href={data.url} target="_blank">{data.name}</a></span>
				<span>•</span>
				<span>
					<a href="/logout">Logout</a>
				</span>
			</p>
		</div>
	{:else}
		<div class="flex-container">
			<p>Sign in to upload a badge</p>
			<a href="/login" role="button">Sign In With GitHub</a>
		</div>
	{/if}
</section>

<style>
	.canvas-container {
		width: 100%;
		aspect-ratio: 1 / 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: sticky;
		top: 2rem;
		left: 0;
		margin-bottom: 2rem;

		@media (max-width: 768px) {
			position: static;
			margin-bottom: 0;
		}
	}

	canvas {
		background-color: black;
		width: 100% !important;
		height: 100% !important;
		border: var(--pico-border-width) solid var(--pico-form-element-border-color);
		border-radius: var(--pico-border-radius);
	}

	legend {
		color: var(--pico-h2-color);
		font-weight: 700;
		font-size: 1.5rem;
		margin-bottom: 1rem;
		line-height: 1.175;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 1rem;
		gap: 2rem;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
			padding: 0;
		}
	}

	.flex-container {
		display: flex;
		flex-direction: column;
		padding: 1rem;

		@media (max-width: 768px) {
			gap: 1rem;
			padding: 0;
		}
	}

	.alert {
		background-color: rgb(51, 21, 32);
		border: 1px solid rgb(189, 66, 109);
		border-radius: var(--pico-border-radius);
		padding: 1rem;

		& p {
			color: rgb(249, 195, 214);
			margin: 0;
		}
	}

	.required {
		color: var(--pico-del-color);
		font-weight: 700;

		&.margin {
			margin-top: 1rem;
		}
	}

	.gif-container,
	.images-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		& button {
			width: 100%;
		}

		& .gif-display {
			background-color: black;
			width: 100%;
			aspect-ratio: 1 / 1;
			border-radius: var(--pico-border-radius);
			border: var(--pico-border-width) solid var(--pico-form-element-border-color);
		}

		& .img-display {
			background-color: black;
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: repeat(3, 1fr);
			width: 100%;
			aspect-ratio: 1 / 1;
			overflow-y: auto;
			scrollbar-width: thin;
			scrollbar-gutter: stable;
			border-radius: var(--pico-border-radius);
			border: var(--pico-border-width) solid var(--pico-form-element-border-color);

			& button {
				border: 2px solid black;
				border-radius: var(--pico-border-radius);

				&:focus-visible,
				&[data-selected='true'] {
					border: 2px solid var(--pico-primary);
				}
			}
		}

		& img {
			border-radius: var(--pico-border-radius);
			width: 100%;
			height: 100%;
		}
	}

	.tablist-container {
		overflow-x: auto;
		margin-bottom: 1.5rem;
		scrollbar-width: none;
	}

	.tablist {
		display: flex;
		border-bottom: 3px solid var(--pico-form-element-border-color);
	}

	.tab {
		margin-bottom: -3px;
		min-width: fit-content;

		& button {
			border-bottom: 3px solid transparent;
			padding: 0 0.75rem 0.5rem 0.75rem;

			&[aria-selected='true'] {
				color: var(--pico-h2-color);
				border-bottom: 3px solid var(--pico-primary);
				font-weight: 600;
			}
		}
	}

	.btn-reset {
		--pico-color: var(--pico-color);
		background-color: transparent;
		border: none;
		margin: 0;
		outline: none;
		box-shadow: none;
		border-radius: 0;
		color: var(--pico-color);
		padding: 0;
		transition: none;
	}
</style>
