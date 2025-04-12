<script lang="ts">
	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step: number;
		oninput?: VoidFunction;
	}

	let { label, min, max, step, value = $bindable(), oninput }: Props = $props();

	function updateValue(v: number) {
		if (v === null) return v;
		return Math.max(min, Math.min(max, v));
	}
</script>

<div>
	<label>
		{label}
		<input type="range" {min} {max} {step} bind:value {oninput} />
	</label>
	<input
		type="number"
		{min}
		{max}
		{step}
		{oninput}
		bind:value={() => value, (v) => (value = updateValue(v))}
	/>
</div>

<style>
	div {
		display: grid;
		grid-template-columns: 1fr 3.5rem;
		align-items: start;
		gap: 0.5rem;

		& input[type='number'] {
			--pico-color: var(--pico-color);
			padding: var(--pico-form-element-spacing-vertical) 0.5rem;
			font-family: var(--pico-font-family-monospace);
			font-size: 0.875rem;
			appearance: none;
			-moz-appearance: textfield;
		}

		input::-webkit-outer-spin-button,
		input::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}
</style>
