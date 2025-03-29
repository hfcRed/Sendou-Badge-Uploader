<script>
	import { Tabs } from 'bits-ui';
	import PicoCADViewer from '$lib/picocad';
	import example from '$lib/picocad/shot.txt?raw';
	import { onMount } from 'svelte';

	let canvas;
	let viewer;

	let centered = $state(true);
	let cameraDistance = $state(30);
	let wireframe = $state(false);
	let outline = $state(false);

	let loadingGif = $state(false);
	let loadingImages = $state(false);

	onMount(() => {
		viewer = new PicoCADViewer({
			canvas
		});

		viewer.load(example);
		viewer.backgroundColor = [0, 0, 0];
		viewer.outlineColor = [1, 1, 1, 1];
		viewer.setResolution(128, 128, 5);
		viewer.cameraFOV = 30;

		const center = getModelCenter(viewer);

		let spin = 0;

		viewer.startDrawLoop((dt) => {
			spin += dt;
			viewer.setTurntableCamera(cameraDistance, spin, 0.1, center);
			viewer.setLightDirectionFromCamera();
		});
	});

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

	// Need tabs for shader and textures
	// The vieport can also have a "tab" above it, which is just text in the style of a tab
	// Add base selection of light maps

	// Giving the form an ID will allow us to place input/formfield elements and submit button outside of the form using the form attribute
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
		<form id="badge">
			<Tabs.Root orientation="horizontal" value="viewport">
				<Tabs.List>
					{#snippet child()}
						<div class="tablist-container">
							<div class="tablist">
								<Tabs.Trigger value="viewport">
									{#snippet child({ props })}
										<div class="tab">
											<button {...props}>Viewport</button>
										</div>
									{/snippet}
								</Tabs.Trigger>
								<Tabs.Trigger value="shader">
									{#snippet child({ props })}
										<div class="tab">
											<button {...props}>Shader</button>
										</div>
									{/snippet}
								</Tabs.Trigger>
								<Tabs.Trigger value="textures">
									{#snippet child({ props })}
										<div class="tab">
											<button {...props}>Textures</button>
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
								name="camera distance"
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
								name="render mode"
								value="Texture"
								onchange={() => (viewer.renderMode = String(event.target.value).toLowerCase())}
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
								name="outline width"
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
								name="outline color"
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
									name="wireframe xray"
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
								name="wireframe color"
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
			<button>Generate GIF</button>
			<div class="gif-display">
				{#if loadingGif}
					<p>Loading...</p>
				{:else}
					<img src="" alt="badge gif" />
				{/if}
			</div>
		</div>
		<div class="images-container"><button disabled>Generate Images</button></div>
	</div>
	<div class="flex-container">
		<label>
			Badge Creator
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
			/>
			<small>Link to the profile of the creator of the badge</small>
		</label>
		<fieldset class="grid">
			<label>
				Tournament Name
				<input
					type="text"
					name="display name"
					required
					minlength="1"
					maxlength="50"
					form="badge"
					autocomplete="off"
					autocorrect="off"
				/>
				<small
					>Name of the tournament the badge was made for, which will be displayed on the site</small
				>
			</label>
			<label>
				Shorthand Name
				<input
					type="text"
					name="shorthand name"
					required
					minlength="1"
					maxlength="50"
					form="badge"
					autocomplete="off"
					autocorrect="off"
					pattern="^[a-zA-Z0-9]+$"
				/>
				<small
					>Short name of the badge for internal idendification. No spaces or special characters</small
				>
			</label>
		</fieldset>
	</div>
</section>
<hr />
<section>
	<h2>Upload</h2>
	<div class="flex-container">
		<p>Signed in as <a href="/" target="_blank">hfcRed</a></p>
		<button type="submit" form="badge">Create Pull Request</button>
	</div>
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
			--pico-color: var(--pico-color);
			background-color: transparent;
			border: none;
			margin: 0;
			outline: none;
			box-shadow: none;
			border-radius: 0;
			border-bottom: 3px solid transparent;
			color: var(--pico-color);
			padding: 0 0.75rem 0.5rem 0.75rem;
			transition: none;

			&[aria-selected='true'] {
				color: var(--pico-h2-color);
				border-bottom: 3px solid var(--pico-primary);
				font-weight: 600;
			}
		}
	}
</style>
