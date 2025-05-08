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
<hr />
<fieldset disabled={!viewer.shader.usingHDTexture}>
	<legend><h4>HD Texture</h4></legend>
	<NumericControl
		label={'Shading Steps'}
		min={0}
		max={25}
		step={1}
		bind:value={viewer.shader.hdOptions.shadingSteps}
		oninput={(e) => (viewer.pico.hdOptions.shadingSteps = parseFloat(e.currentTarget.value))}
	/>
	<label>
		Shading Color
		<input
			type="color"
			bind:value={viewer.shader.hdOptions.shadingColor}
			oninput={(e) => (viewer.pico.hdOptions.shadingColor = hexToRGB(e.currentTarget.value))}
		/>
	</label>
	<NumericControl
		label={'Normal Map Strength'}
		min={0}
		max={1}
		step={0.01}
		bind:value={viewer.shader.hdOptions.normalMapStrength}
		oninput={(e) => (viewer.pico.hdOptions.normalMapStrength = parseFloat(e.currentTarget.value))}
	/>
</fieldset>
<hr />
<h3>Effects</h3>
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.outlineA.enabled}
				aria-checked={viewer.shader.outlineA.enabled}
				oninput={(e) => (viewer.pico.outlineA.enabled = e.currentTarget.checked)}
			/>
			<h4>First Outline</h4>
		</label>
	</legend>
	{#if viewer.shader.outlineA.enabled}
		<NumericControl
			label={'Width'}
			min={0}
			max={25}
			step={1}
			bind:value={viewer.shader.outlineA.size}
			oninput={(e) => (viewer.pico.outlineA.size = parseFloat(e.currentTarget.value))}
		/>
		<label>
			Color
			<input
				type="color"
				bind:value={viewer.shader.outlineA.colorFrom}
				oninput={(e) => (viewer.pico.outlineA.colorFrom = hexToRGB(e.currentTarget.value))}
			/>
		</label>
		<label>
			Gradient Color
			<input
				type="color"
				bind:value={viewer.shader.outlineA.colorTo}
				oninput={(e) => (viewer.pico.outlineA.colorTo = hexToRGB(e.currentTarget.value))}
			/>
		</label>
		<NumericControl
			label={'Gradient Strength'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.outlineA.gradient}
			oninput={(e) => (viewer.pico.outlineA.gradient = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Gradient Direction'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.outlineA.gradientDirection}
			oninput={(e) => (viewer.pico.outlineA.gradientDirection = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.outlineB.enabled}
				aria-checked={viewer.shader.outlineB.enabled}
				oninput={(e) => (viewer.pico.outlineB.enabled = e.currentTarget.checked)}
			/>
			<h4>Second Outline</h4>
		</label>
	</legend>
	{#if viewer.shader.outlineB.enabled}
		<NumericControl
			label={'Width'}
			min={0}
			max={25}
			step={1}
			bind:value={viewer.shader.outlineB.size}
			oninput={(e) => (viewer.pico.outlineB.size = parseFloat(e.currentTarget.value))}
		/>
		<label>
			Color
			<input
				type="color"
				bind:value={viewer.shader.outlineB.colorFrom}
				oninput={(e) => (viewer.pico.outlineB.colorFrom = hexToRGB(e.currentTarget.value))}
			/>
		</label>
		<label>
			Gradient Color
			<input
				type="color"
				bind:value={viewer.shader.outlineB.colorTo}
				oninput={(e) => (viewer.pico.outlineB.colorTo = hexToRGB(e.currentTarget.value))}
			/>
		</label>
		<NumericControl
			label={'Gradient Strength'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.outlineB.gradient}
			oninput={(e) => (viewer.pico.outlineB.gradient = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Gradient Direction'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.outlineB.gradientDirection}
			oninput={(e) => (viewer.pico.outlineB.gradientDirection = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.wireframe.enabled}
				aria-checked={viewer.shader.wireframe.enabled}
				onchange={() => (viewer.pico.drawWireframe = viewer.shader.wireframe.enabled)}
			/>
			<h4>Wireframe</h4>
		</label>
	</legend>
	{#if viewer.shader.wireframe.enabled}
		<label class="form-margin">
			<input
				type="checkbox"
				role="switch"
				bind:checked={viewer.shader.wireframe.xray}
				onchange={() => (viewer.pico.wireframeXray = viewer.shader.wireframe.xray)}
			/>
			Wireframe X-Ray
		</label>
		<label>
			Wireframe Color
			<input
				type="color"
				bind:value={viewer.shader.wireframe.color}
				oninput={(e) => (viewer.pico.wireframeColor = hexToRGB(e.currentTarget.value))}
			/>
		</label>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.chromaticAberration.enabled}
				aria-checked={viewer.shader.chromaticAberration.enabled}
				oninput={(e) => (viewer.pico.chromaticAberration.enabled = e.currentTarget.checked)}
			/>
			<h4>Chromatic Aberration</h4>
		</label>
	</legend>
	{#if viewer.shader.chromaticAberration.enabled}
		<NumericControl
			label={'Strength'}
			min={0}
			max={2}
			step={0.01}
			bind:value={viewer.shader.chromaticAberration.strength}
			oninput={(e) =>
				(viewer.pico.chromaticAberration.strength = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Red Offset'}
			min={-1}
			max={1}
			step={0.01}
			bind:value={viewer.shader.chromaticAberration.redOffset}
			oninput={(e) =>
				(viewer.pico.chromaticAberration.redOffset = parseFloat(e.currentTarget.value))}
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
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.colorGrading.enabled}
				aria-checked={viewer.shader.colorGrading.enabled}
				oninput={(e) => (viewer.pico.colorGrading.enabled = e.currentTarget.checked)}
			/>
			<h4>Color Grading</h4>
		</label>
	</legend>
	{#if viewer.shader.colorGrading.enabled}
		<NumericControl
			label={'Brightness'}
			min={0}
			max={3}
			step={0.01}
			bind:value={viewer.shader.colorGrading.brightness}
			oninput={(e) => (viewer.pico.colorGrading.brightness = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Contrast'}
			min={0}
			max={3}
			step={0.01}
			bind:value={viewer.shader.colorGrading.contrast}
			oninput={(e) => (viewer.pico.colorGrading.contrast = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Saturation'}
			min={0}
			max={3}
			step={0.01}
			bind:value={viewer.shader.colorGrading.saturation}
			oninput={(e) => (viewer.pico.colorGrading.saturation = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Hue'}
			min={-1}
			max={1}
			step={0.01}
			bind:value={viewer.shader.colorGrading.hue}
			oninput={(e) => (viewer.pico.colorGrading.hue = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.posterize.enabled}
				aria-checked={viewer.shader.posterize.enabled}
				oninput={(e) => (viewer.pico.posterize.enabled = e.currentTarget.checked)}
			/>
			<h4>Posterize</h4>
		</label>
	</legend>
	{#if viewer.shader.posterize.enabled}
		<NumericControl
			label={'Levels'}
			min={2}
			max={10}
			step={1}
			bind:value={viewer.shader.posterize.levels}
			oninput={(e) => (viewer.pico.posterize.levels = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Red Levels'}
			min={0}
			max={5}
			step={0.01}
			bind:value={viewer.shader.posterize.channelLevels[0]}
			oninput={(e) => {
				viewer.shader.posterize.channelLevels[0] = parseFloat(e.currentTarget.value);
				viewer.pico.posterize.channelLevels = [...viewer.shader.posterize.channelLevels];
			}}
		/>
		<NumericControl
			label={'Green Levels'}
			min={0}
			max={5}
			step={0.01}
			bind:value={viewer.shader.posterize.channelLevels[1]}
			oninput={(e) => {
				viewer.shader.posterize.channelLevels[1] = parseFloat(e.currentTarget.value);
				viewer.pico.posterize.channelLevels = [...viewer.shader.posterize.channelLevels];
			}}
		/>
		<NumericControl
			label={'Blue Levels'}
			min={0}
			max={5}
			step={0.01}
			bind:value={viewer.shader.posterize.channelLevels[2]}
			oninput={(e) => {
				viewer.shader.posterize.channelLevels[2] = parseFloat(e.currentTarget.value);
				viewer.pico.posterize.channelLevels = [...viewer.shader.posterize.channelLevels];
			}}
		/>
		<NumericControl
			label={'Gamma'}
			min={0}
			max={5}
			step={0.01}
			bind:value={viewer.shader.posterize.gamma}
			oninput={(e) => (viewer.pico.posterize.gamma = parseFloat(e.currentTarget.value))}
		/>
		<label class="form-margin">
			<input
				type="checkbox"
				role="switch"
				bind:checked={viewer.shader.posterize.colorBanding}
				oninput={(e) => (viewer.pico.posterize.colorBanding = e.currentTarget.checked)}
			/>
			Color Banding
		</label>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.noise.enabled}
				aria-checked={viewer.shader.noise.enabled}
				oninput={(e) => (viewer.pico.noise.enabled = e.currentTarget.checked)}
			/>
			<h4>Noise</h4>
		</label>
	</legend>
	{#if viewer.shader.noise.enabled}
		<NumericControl
			label={'Amount'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.noise.amount}
			oninput={(e) => (viewer.pico.noise.amount = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.bloom.enabled}
				aria-checked={viewer.shader.bloom.enabled}
				oninput={(e) => (viewer.pico.bloom.enabled = e.currentTarget.checked)}
			/>
			<h4>Bloom</h4>
		</label>
	</legend>
	{#if viewer.shader.bloom.enabled}
		<NumericControl
			label={'Threshold'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.bloom.threshold}
			oninput={(e) => (viewer.pico.bloom.threshold = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Intensity'}
			min={0}
			max={5}
			step={0.01}
			bind:value={viewer.shader.bloom.intensity}
			oninput={(e) => (viewer.pico.bloom.intensity = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Blur'}
			min={0}
			max={5}
			step={0.01}
			bind:value={viewer.shader.bloom.blur}
			oninput={(e) => (viewer.pico.bloom.blur = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.dither.enabled}
				aria-checked={viewer.shader.dither.enabled}
				oninput={(e) => (viewer.pico.dither.enabled = e.currentTarget.checked)}
			/>
			<h4>Dither</h4>
		</label>
	</legend>
	{#if viewer.shader.dither.enabled}
		<NumericControl
			label={'Amount'}
			min={0}
			max={2}
			step={0.01}
			bind:value={viewer.shader.dither.amount}
			oninput={(e) => (viewer.pico.dither.amount = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Blend'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.dither.blend}
			oninput={(e) => (viewer.pico.dither.blend = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Red Channel'}
			min={0}
			max={2}
			step={0.01}
			bind:value={viewer.shader.dither.channelAmount[0]}
			oninput={(e) => {
				viewer.shader.dither.channelAmount[0] = parseFloat(e.currentTarget.value);
				viewer.pico.dither.channelAmount = [...viewer.shader.dither.channelAmount];
			}}
		/>
		<NumericControl
			label={'Green Channel'}
			min={0}
			max={2}
			step={0.01}
			bind:value={viewer.shader.dither.channelAmount[1]}
			oninput={(e) => {
				viewer.shader.dither.channelAmount[1] = parseFloat(e.currentTarget.value);
				viewer.pico.dither.channelAmount = [...viewer.shader.dither.channelAmount];
			}}
		/>
		<NumericControl
			label={'Blue Channel'}
			min={0}
			max={2}
			step={0.01}
			bind:value={viewer.shader.dither.channelAmount[2]}
			oninput={(e) => {
				viewer.shader.dither.channelAmount[2] = parseFloat(e.currentTarget.value);
				viewer.pico.dither.channelAmount = [...viewer.shader.dither.channelAmount];
			}}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.crt.enabled}
				aria-checked={viewer.shader.crt.enabled}
				oninput={(e) => (viewer.pico.crt.enabled = e.currentTarget.checked)}
			/>
			<h4>CRT</h4>
		</label>
	</legend>
	{#if viewer.shader.crt.enabled}
		<NumericControl
			label={'Curvature'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.crt.curvature}
			oninput={(e) => (viewer.pico.crt.curvature = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Scanline Intensity'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.crt.scanlineIntensity}
			oninput={(e) => (viewer.pico.crt.scanlineIntensity = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.pixelate.enabled}
				aria-checked={viewer.shader.pixelate.enabled}
				oninput={(e) => (viewer.pico.pixelate.enabled = e.currentTarget.checked)}
			/>
			<h4>Pixelate</h4>
		</label>
	</legend>
	{#if viewer.shader.pixelate.enabled}
		<NumericControl
			label={'Pixel Size'}
			min={1}
			max={10}
			step={0.01}
			bind:value={viewer.shader.pixelate.pixelSize}
			oninput={(e) => (viewer.pico.pixelate.pixelSize = parseFloat(e.currentTarget.value))}
		/>
		<label>
			Shape
			<select
				bind:value={viewer.shader.pixelate.shape}
				onchange={(e) => (viewer.pico.pixelate.shape = e.currentTarget.value)}
			>
				<option value="square">Square</option>
				<option value="hex">Hex</option>
				<option value="diamond">Diamond</option>
				<option value="circle">Circle</option>
				<option value="triangle">Triangle</option>
				<option value="cross">Cross</option>
				<option value="star">Star</option>
			</select>
		</label>
		<NumericControl
			label={'Blend'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.pixelate.blend}
			oninput={(e) => (viewer.pico.pixelate.blend = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.lensDistortion.enabled}
				aria-checked={viewer.shader.lensDistortion.enabled}
				oninput={(e) => (viewer.pico.lensDistortion.enabled = e.currentTarget.checked)}
			/>
			<h4>Lens Distortion</h4>
		</label>
	</legend>
	{#if viewer.shader.lensDistortion.enabled}
		<NumericControl
			label={'Strength'}
			min={-2}
			max={2}
			step={0.01}
			bind:value={viewer.shader.lensDistortion.strength}
			oninput={(e) => (viewer.pico.lensDistortion.strength = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Zoom'}
			min={0.1}
			max={5}
			step={0.01}
			bind:value={viewer.shader.lensDistortion.zoom}
			oninput={(e) => (viewer.pico.lensDistortion.zoom = parseFloat(e.currentTarget.value))}
		/>
	{/if}
</fieldset>
<hr />
<fieldset>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.floorReflection.enabled}
				aria-checked={viewer.shader.floorReflection.enabled}
				oninput={(e) => (viewer.pico.floorReflection.enabled = e.currentTarget.checked)}
			/>
			<h4>Floor Reflection</h4>
		</label>
	</legend>
	{#if viewer.shader.floorReflection.enabled}
		<NumericControl
			label={'Opacity'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.floorReflection.opacity}
			oninput={(e) => (viewer.pico.floorReflection.opacity = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Height'}
			min={-10}
			max={10}
			step={0.01}
			bind:value={viewer.shader.floorReflection.height}
			oninput={(e) => (viewer.pico.floorReflection.height = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Fade Distance'}
			min={0}
			max={10}
			step={0.01}
			bind:value={viewer.shader.floorReflection.fadeDistance}
			oninput={(e) =>
				(viewer.pico.floorReflection.fadeDistance = parseFloat(e.currentTarget.value))}
		/>
		<label>
			Color
			<input
				type="color"
				bind:value={viewer.shader.floorReflection.color}
				oninput={(e) => (viewer.pico.floorReflection.color = hexToRGB(e.currentTarget.value))}
			/>
		</label>
	{/if}
</fieldset>
<h3>HD Effects</h3>
<fieldset disabled={!viewer.shader.usingHDTexture}>
	<legend>
		<label>
			<input
				type="checkbox"
				bind:checked={viewer.shader.hdOptions.specular.enabled}
				aria-checked={viewer.shader.hdOptions.specular.enabled}
				oninput={(e) => (viewer.pico.hdOptions.specular.enabled = e.currentTarget.checked)}
			/>
			<h4>Specular</h4>
		</label>
	</legend>
	{#if viewer.shader.hdOptions.specular.enabled}
		<NumericControl
			label={'Strength'}
			min={0}
			max={1}
			step={0.01}
			bind:value={viewer.shader.hdOptions.specular.strength}
			oninput={(e) => (viewer.pico.hdOptions.specular.strength = parseFloat(e.currentTarget.value))}
		/>
		<NumericControl
			label={'Smoothness'}
			min={0}
			max={100}
			step={0.01}
			bind:value={viewer.shader.hdOptions.specular.smoothness}
			oninput={(e) =>
				(viewer.pico.hdOptions.specular.smoothness = parseFloat(e.currentTarget.value))}
		/>
		<input
			type="color"
			bind:value={viewer.shader.hdOptions.specular.color}
			oninput={(e) => (viewer.pico.hdOptions.specular.color = hexToRGB(e.currentTarget.value))}
		/>
	{/if}
</fieldset>

<style>
	legend > label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		user-select: none;

		&:has(input[aria-checked='true']) {
			margin-bottom: 1rem;
		}

		& h4,
		input {
			margin: 0;
		}
	}

	fieldset[disabled] {
		opacity: var(--pico-form-element-disabled-opacity);
		pointer-events: none;
	}
</style>
