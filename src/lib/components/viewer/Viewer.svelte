<script lang="ts">
	import { onMount } from 'svelte';
	import { Tabs } from 'bits-ui';
	import { viewer } from './viewer-state.svelte';
	import rotationGif from '$lib/picocad/files/rotation-overlay.gif';
	import Ruler from './Ruler.svelte';
	import Viewport from './Viewport.svelte';
	import Shader from './Shader.svelte';
	import Models from './Models.svelte';

	let viewportCanvas: HTMLCanvasElement;
	let textureCanvas: HTMLCanvasElement;
	let lightmapCanvas: HTMLCanvasElement;

	onMount(() => {
		viewer.init(viewportCanvas, textureCanvas, lightmapCanvas);
	});
</script>

<section>
	<h2>Display Settings</h2>
	<div class="grid-container">
		<div class="canvas-container">
			<canvas bind:this={viewportCanvas}></canvas>
			{#if viewer.viewport.rulers}
				<Ruler />
			{/if}
			{#if viewer.viewport.rotationOverlay}
				<img class="overlay" src={rotationGif} alt="" />
			{/if}
			{#if !viewer.viewport.isCentered}
				<aside aria-label="warning" class="alert">
					<p>Model is not centered, this might not be intentional!</p>
				</aside>
			{/if}
		</div>
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
							<Tabs.Trigger value="models">
								{#snippet child({ props })}
									<div class="tab">
										<button class="btn-reset" {...props}>Models</button>
									</div>
								{/snippet}
							</Tabs.Trigger>
						</div>
					</div>
				{/snippet}
			</Tabs.List>
			<Tabs.Content value="viewport">
				<Viewport />
			</Tabs.Content>
			<Tabs.Content value="shader">
				<Shader />
			</Tabs.Content>
			<Tabs.Content value="textures">
				<h3>Main Texture</h3>
				<canvas class="texture" width="128" height="120" bind:this={textureCanvas}></canvas>
				<h3>Lightmap</h3>
				<canvas class="texture" width="32" height="7" bind:this={lightmapCanvas}></canvas>
			</Tabs.Content>
			<Tabs.Content value="models">
				<Models />
			</Tabs.Content>
		</Tabs.Root>
	</div>
</section>

<style>
	.canvas-container {
		position: sticky;
		top: 2rem;
		left: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		aspect-ratio: 1 / 1;

		@media (max-width: 768px) {
			position: relative;
			top: 0;
			margin-bottom: 0;
		}
	}

	canvas {
		border: var(--pico-border-width) solid var(--pico-form-element-border-color);
		border-radius: var(--pico-border-radius);
		background-color: black;
		width: 100% !important;
		height: 100% !important;
		aspect-ratio: 1;

		&.texture {
			aspect-ratio: unset;
			image-rendering: pixelated;

			&:not(:last-child) {
				margin-bottom: 2rem;
			}
		}

		&:global([data-dragging='true']) {
			border: var(--pico-border-width) solid var(--pico-primary);
		}
	}

	.overlay {
		border: var(--pico-border-width) solid var(--pico-form-element-border-color);
		border-radius: var(--pico-border-radius);
		position: absolute;
		inset: 0;
		opacity: 0.5;
		width: 100%;
		aspect-ratio: 1 / 1;
		pointer-events: none;
	}
</style>
