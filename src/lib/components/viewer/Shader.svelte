<script lang="ts">
	import type { PicoCADRenderMode } from '$lib/picocad';
	import { hexToRGB } from '$lib/utilities';
	import { viewer } from './viewer-state.svelte';
</script>

<fieldset>
	<legend>Rendering</legend>
	<label>
		Render Mode
		<select
			bind:value={viewer.shader.renderMode}
			onchange={(e) =>
				(viewer.pico.renderMode = String(e.currentTarget.value).toLowerCase() as PicoCADRenderMode)}
		>
			<option>Texture</option>
			<option>Color</option>
			<option>None</option>
		</select>
	</label>
	<label class="form-margin">
		<input
			type="checkbox"
			role="switch"
			bind:checked={viewer.shader.shading}
			onchange={() => (viewer.pico.shading = viewer.shader.shading)}
		/>
		Shading
	</label>
	<label>
		HD Shading Steps
		<input
			type="range"
			min="0"
			max="25"
			step="1"
			bind:value={viewer.shader.hdShadingSteps}
			oninput={(e) => (viewer.pico.hdOptions.shadingSteps = parseFloat(e.currentTarget.value))}
			disabled={!viewer.shader.usingHDTexture}
		/>
	</label>
	<label>
		HD Shading Color
		<input
			type="color"
			bind:value={viewer.shader.hdShadingColor}
			oninput={(e) => (viewer.pico.hdOptions.shadingColor = hexToRGB(e.currentTarget.value))}
			disabled={!viewer.shader.usingHDTexture}
		/>
	</label>
</fieldset>
<hr />
<fieldset>
	<legend>Outline</legend>
	<label>
		Outline Width
		<input
			type="range"
			min="0"
			max="25"
			step="1"
			bind:value={viewer.shader.outlineWidth}
			oninput={(e) => (viewer.pico.outlineSize = parseFloat(e.currentTarget.value))}
		/>
	</label>
	<label>
		Outline Color
		<input
			type="color"
			bind:value={viewer.shader.outlineColor}
			oninput={(e) => (viewer.pico.outlineColor = hexToRGB(e.currentTarget.value))}
			disabled={viewer.shader.outlineWidth <= 0}
		/>
	</label>
</fieldset>
<hr />
<fieldset>
	<legend>Wireframe</legend>
	<div role="group">
		<label>
			<input
				type="checkbox"
				role="switch"
				bind:checked={viewer.shader.wireframe}
				onchange={() => (viewer.pico.drawWireframe = viewer.shader.wireframe)}
			/>
			Wireframe
		</label>
		<label>
			<input
				type="checkbox"
				role="switch"
				bind:checked={viewer.shader.wireframeXray}
				onchange={() => (viewer.pico.wireframeXray = viewer.shader.wireframeXray)}
				disabled={!viewer.shader.wireframe}
			/>
			Wireframe X-Ray
		</label>
	</div>
	<label>
		Wireframe Color
		<input
			type="color"
			bind:value={viewer.shader.wireframeColor}
			oninput={(e) => (viewer.pico.wireframeColor = hexToRGB(e.currentTarget.value))}
			disabled={!viewer.shader.wireframe}
		/>
	</label>
</fieldset>

<style>
	.form-margin {
		margin-bottom: 1.25rem;
	}
</style>
