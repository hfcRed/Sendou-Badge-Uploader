<script lang="ts">
	import type { PicoCADRenderMode } from '$lib/picocad';
	import { hexToRGB } from '$lib/utilities';
	import { viewer } from './viewer-state.svelte';
	import NumericControl from '../NumericControl.svelte';
</script>

<fieldset>
	<legend><h3>Rendering</h3></legend>
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
	<fieldset disabled={!viewer.shader.usingHDTexture}>
		<legend><h4>HD Texture</h4></legend>
		<NumericControl
			label={'Shading Steps'}
			min={0}
			max={25}
			step={1}
			bind:value={viewer.shader.hdShadingSteps}
			oninput={(e) => (viewer.pico.hdOptions.shadingSteps = parseFloat(e.currentTarget.value))}
		/>
		<label>
			Shading Color
			<input
				type="color"
				bind:value={viewer.shader.hdShadingColor}
				oninput={(e) => (viewer.pico.hdOptions.shadingColor = hexToRGB(e.currentTarget.value))}
			/>
		</label>
		<NumericControl
			label={'Normal Map Strength'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.normalStrength}
			oninput={(e) => (viewer.pico.hdOptions.normalMapStrength = parseFloat(e.currentTarget.value))}
		/>
	</fieldset>
</fieldset>
<hr />
<h3>Effects</h3>
<fieldset>
	<legend><h4>Outline</h4></legend>
	<NumericControl
		label={'Outline Width'}
		min={0}
		max={25}
		step={1}
		bind:value={viewer.shader.outlineWidth}
		oninput={(e) => (viewer.pico.outlineSize = parseFloat(e.currentTarget.value))}
	/>
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
	<legend><h4>Wireframe</h4></legend>
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
<hr />
<fieldset class="tighten">
	<legend><h4>Chromatic Aberration</h4></legend>
	<NumericControl
		label={'Strength'}
		min={0}
		max={2}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.strength}
		oninput={(e) => (viewer.pico.chromaticAberration.strength = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Red Offset'}
		min={-1}
		max={1}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.redOffset}
		oninput={(e) => (viewer.pico.chromaticAberration.redOffset = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Green Offset'}
		min={-1}
		max={1}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.greenOffset}
		oninput={(e) =>
			(viewer.pico.chromaticAberration.greenOffset = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Blue Offset'}
		min={-1}
		max={1}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.blueOffset}
		oninput={(e) =>
			(viewer.pico.chromaticAberration.blueOffset = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Radial Falloff'}
		min={-2}
		max={2}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.radialFalloff}
		oninput={(e) =>
			(viewer.pico.chromaticAberration.radialFalloff = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Center X'}
		min={-1}
		max={1}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.centerX}
		oninput={(e) => (viewer.pico.chromaticAberration.centerX = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Center Y'}
		min={-1}
		max={1}
		step={0.01}
		bind:value={viewer.shader.chromaticAberration.centerY}
		oninput={(e) => (viewer.pico.chromaticAberration.centerY = parseFloat(e.currentTarget.value))}
	/>
</fieldset>

<style>
	.form-margin {
		margin-bottom: 1.5rem;
	}

	fieldset > fieldset {
		margin-bottom: 0;
	}
</style>
