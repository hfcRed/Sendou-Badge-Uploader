<script lang="ts">
	import type { PicoCADRenderMode } from '$lib/picocad';
	import { hexToRGB } from '$lib/utilities';
	import { viewer } from './viewer-state.svelte';
	import NumericControl from '../NumericControl.svelte';
</script>

<h3>Rendering</h3>
<fieldset>
	<legend><h4>Basic</h4></legend>
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
	<label>
		<input
			type="checkbox"
			role="switch"
			bind:checked={viewer.shader.shading}
			onchange={() => (viewer.pico.shading = viewer.shader.shading)}
		/>
		Shading
	</label>
</fieldset>
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
<hr />
<h3>Effects</h3>
<fieldset>
	<legend><h4>First Outline</h4></legend>
	<NumericControl
		label={'Width'}
		min={0}
		max={25}
		step={1}
		bind:value={viewer.shader.outline.sizeA}
		oninput={(e) => (viewer.pico.outline.sizeA = parseFloat(e.currentTarget.value))}
	/>
	<label>
		Color
		<input
			type="color"
			bind:value={viewer.shader.outline.colorA}
			oninput={(e) => (viewer.pico.outline.colorA = hexToRGB(e.currentTarget.value))}
		/>
	</label>
	<label>
		Gradient Color
		<input
			type="color"
			bind:value={viewer.shader.outline.colorA2}
			oninput={(e) => (viewer.pico.outline.colorA2 = hexToRGB(e.currentTarget.value))}
		/>
	</label>
	<NumericControl
		label={'Gradient Strength'}
		min={0}
		max={1}
		step={0.01}
		bind:value={viewer.shader.outline.gradientA}
		oninput={(e) => (viewer.pico.outline.gradientA = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Gradient Direction'}
		min={0}
		max={1}
		step={0.01}
		bind:value={viewer.shader.outline.gradientDirectionA}
		oninput={(e) => (viewer.pico.outline.gradientDirectionA = parseFloat(e.currentTarget.value))}
	/>
</fieldset>
<hr />
<fieldset>
	<legend><h4>Second Outline</h4></legend>
	<NumericControl
		label={'Width'}
		min={0}
		max={25}
		step={1}
		bind:value={viewer.shader.outline.sizeB}
		oninput={(e) => (viewer.pico.outline.sizeB = parseFloat(e.currentTarget.value))}
	/>
	<label>
		Color
		<input
			type="color"
			bind:value={viewer.shader.outline.colorB}
			oninput={(e) => (viewer.pico.outline.colorB = hexToRGB(e.currentTarget.value))}
		/>
	</label>
	<label>
		Gradient Color
		<input
			type="color"
			bind:value={viewer.shader.outline.colorB2}
			oninput={(e) => (viewer.pico.outline.colorB2 = hexToRGB(e.currentTarget.value))}
		/>
	</label>
	<NumericControl
		label={'Gradient Strength'}
		min={0}
		max={1}
		step={0.01}
		bind:value={viewer.shader.outline.gradientB}
		oninput={(e) => (viewer.pico.outline.gradientB = parseFloat(e.currentTarget.value))}
	/>
	<NumericControl
		label={'Gradient Direction'}
		min={0}
		max={1}
		step={0.01}
		bind:value={viewer.shader.outline.gradientDirectionB}
		oninput={(e) => (viewer.pico.outline.gradientDirectionB = parseFloat(e.currentTarget.value))}
	/>
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
<fieldset>
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
