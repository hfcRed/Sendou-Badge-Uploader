<script lang="ts">
	import { viewer } from '../../+states/viewer-state.svelte';
	import NumericControl from '$lib/components/NumericControl.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Shortcuts from './Shortcuts.svelte';

	function getModelCenter() {
		const objects = viewer.pico.model.objects;
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

		viewer.viewport.isCentered = Math.abs(centerX) <= 0.2 && Math.abs(centerZ) <= 0.2;

		return {
			x: 0,
			y: centerY,
			z: 0
		};
	}
</script>

<fieldset>
	<legend><h3>Camera</h3></legend>
	<NumericControl
		label="Distance"
		min={0}
		max={100}
		step={0.01}
		bind:value={viewer.viewport.cameraDistance}
	/>
	<NumericControl
		label="Height"
		min={-10}
		max={10}
		step={0.01}
		bind:value={viewer.viewport.cameraHeight}
	/>
	<NumericControl
		label="Tilt"
		min={-1}
		max={1}
		step={0.01}
		bind:value={viewer.viewport.cameraTilt}
	/>
	<NumericControl
		label="Rotation"
		min={0}
		max={Math.PI * 2}
		step={0.01}
		bind:value={viewer.viewport.cameraRotation}
		oninput={() => (viewer.viewport.turntable = false)}
	/>
	<label class="form-margin">
		<input type="checkbox" role="switch" bind:checked={viewer.viewport.turntable} />
		Turntable
	</label>
</fieldset>
<hr />
<fieldset>
	<legend><h3>Utilities</h3></legend>
	<label class="form-margin">
		<input type="checkbox" role="switch" bind:checked={viewer.viewport.rulers} />
		Rulers
	</label>
	<button
		type="button"
		onclick={() => {
			const center = getModelCenter();
			viewer.viewport.cameraHeight = center.y;
		}}>Center Model</button
	>
	<Dialog buttonText="Shortcuts">
		{#snippet title()}
			Shortcuts
		{/snippet}

		{#snippet description()}
			<Shortcuts />
		{/snippet}
	</Dialog>
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
