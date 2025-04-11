<script lang="ts">
	import { viewer } from './viewer-state.svelte';

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
			bind:value={viewer.viewport.cameraRotation}
			oninput={(e) => (viewer.viewport.turntable = false)}
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
			const center = getModelCenter();
			viewer.viewport.cameraHeight = center.y;
		}}>Center Model</button
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
