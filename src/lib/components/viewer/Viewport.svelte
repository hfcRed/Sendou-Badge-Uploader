<script lang="ts">
	import { viewer } from './viewer-state.svelte';
</script>

<fieldset>
	<legend>Camera</legend>
	<label>
		Distance
		<input type="range" min="0" max="100" step="0.01" bind:value={viewer.viewport.cameraDistance} />
	</label>
	<label>
		Height
		<input type="range" min="-10" max="10" step="0.01" bind:value={viewer.viewport.cameraHeight} />
	</label>
	<label>
		Tilt
		<input type="range" min="-1" max="1" step="0.01" bind:value={viewer.viewport.cameraTilt} />
	</label>
	<label>
		Rotation
		<input
			type="range"
			min="0"
			max="6.283185307179586"
			step="0.01"
			oninput={(e) => {
				viewer.viewport.turntable = false;
				viewer.viewport.cameraRotation = parseFloat(e.currentTarget.value);
			}}
		/>
	</label>
	<label class="form-margin">
		<input type="checkbox" role="switch" bind:checked={viewer.viewport.turntable} />
		Turntable
	</label>
	<label>
		Turntable Speed
		<input type="range" min="0" max="3" step="0.01" bind:value={viewer.viewport.turntableSpeed} />
	</label>
</fieldset>
<hr />
<fieldset>
	<legend>Utilities</legend>
	<label>
		<input type="checkbox" role="switch" bind:checked={viewer.viewport.rulers} />
		Rulers
	</label>
	<label class="form-margin">
		<input type="checkbox" role="switch" bind:checked={viewer.viewport.rotationOverlay} />
		Rotation Overlay
	</label>
	<button
		type="button"
		onclick={() => {
			const center = viewer.getModelCenter();
			viewer.viewport.cameraHeight = center.y;
		}}>Re-calculate Height</button
	>
</fieldset>
<hr />
<label>
	Watermark
	<input
		type="text"
		min="0"
		max="25"
		autocorrect="off"
		bind:value={viewer.viewport.watermark}
		oninput={(e) => {
			viewer.pico.setWatermark(e.currentTarget.value);
		}}
	/>
</label>
