<script lang="ts">
	import { SuperGif } from '@wizpanda/super-gif';
	import { viewer } from './viewer/viewer-state.svelte';
	import { handleInputChange } from '$lib/utilities';

	let { shorthandName = $bindable('') } = $props();

	let initSG = $state(false);

	$inspect(viewer.images.generated);

	async function splitGifIntoFrames() {
		viewer.images = {
			generating: true,
			progress: 0,
			generated: []
		};

		const img = new Image();
		img.src = viewer.gif.url ?? '';
		await new Promise((resolve) => (img.onload = resolve));

		const canvas = document.createElement('canvas');
		[canvas.width, canvas.height] = [img.naturalWidth, img.naturalHeight];
		const ctx = canvas.getContext('2d')!;

		initSG = true;
		const gif = new SuperGif(img, {
			autoplay: false,
			maxWidth: 511.999999999999
		});
		await new Promise((resolve) => gif.load(resolve));
		initSG = false;

		const frames = gif.getLength();
		for (let i = 0; i < frames; i++) {
			viewer.images.progress = Math.floor((i / frames) * 100);

			gif.moveTo(i);
			ctx.drawImage(gif.getCanvas(), 0, 0);

			const frameDataUrl = canvas.toDataURL('image/png');
			viewer.images.generated.push({ url: frameDataUrl, selected: false });

			await new Promise((resolve) => requestAnimationFrame(resolve));
		}

		viewer.images.generating = false;
		canvas.remove();
	}
</script>

<section>
	<h2>Files and Data</h2>
	<div class="grid-container">
		<div class="gif-container">
			<button
				disabled={!viewer.workerLoaded || viewer.gif.recording}
				onclick={() => viewer.startGifRecording()}
				>{#if !viewer.gif.recording}Generate GIF{:else}{viewer.gif.progress} %{/if}</button
			>
			<div class="gif-display">
				{#if viewer.gif.url}
					<img src={viewer.gif.url} alt="badge gif" draggable="false" />
				{/if}
			</div>
			<small>The GIF to be displayed on the site</small>
		</div>
		<div class="images-container">
			<button
				aria-busy={initSG}
				disabled={!viewer.gif.url || viewer.images.generating}
				onclick={() => splitGifIntoFrames()}
				>{#if !viewer.images.generating}Generate Images{:else if !initSG}{viewer.images.progress} %{/if}</button
			>
			<div class="img-display">
				{#if viewer.images.generated.length > 0}
					{#each viewer.images.generated as image, i}
						<button
							class="btn-reset"
							data-selected={image.selected}
							onclick={() => {
								viewer.images.generated.forEach((i) => (i.selected = false));
								viewer.images.generated[i].selected = true;
							}}><img src={image.url} alt="badge" draggable="false" /></button
						>
					{/each}
				{/if}
			</div>
			<small>Select an image to be the thumbnail</small>
		</div>
	</div>
	<div class="flex-container">
		<label>
			Badge Creator <span class="required">*</span>
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
				onchange={(e) => handleInputChange(e)}
			/>
			<small>Link to the profile of the creator of the badge</small>
		</label>
		<fieldset class="grid">
			<label>
				Tournament Name <span class="required">*</span>
				<input
					type="text"
					name="displayName"
					required
					minlength="5"
					maxlength="50"
					form="badge"
					autocomplete="off"
					autocorrect="off"
					pattern="[\u0000-\u024F]*"
					onchange={(e) => handleInputChange(e)}
				/>
				<small
					>Name of the tournament the badge was made for, which will be displayed on the site</small
				>
			</label>
			<label>
				Shorthand Name <span class="required">*</span>
				<input
					type="text"
					name="shorthandName"
					required
					minlength="5"
					maxlength="50"
					form="badge"
					autocomplete="off"
					autocorrect="off"
					pattern="^[a-zA-Z0-9]+$"
					onchange={(e) => handleInputChange(e)}
					bind:value={shorthandName}
				/>
				<small
					>Short name of the badge for internal idendification. No spaces or special characters</small
				>
			</label>
		</fieldset>
		<label>
			Additional Notes
			<textarea
				name="notes"
				rows="3"
				maxlength="500"
				form="badge"
				autocomplete="off"
				onchange={(e) => handleInputChange(e)}
			></textarea>
		</label>
	</div>
</section>

<style>
	.gif-container,
	.images-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		& button {
			width: 100%;
		}

		& .gif-display {
			border: var(--pico-border-width) solid var(--pico-form-element-border-color);
			border-radius: var(--pico-border-radius);
			background-color: black;
			width: 100%;
			aspect-ratio: 1 / 1;
		}

		& .img-display {
			border: var(--pico-border-width) solid var(--pico-form-element-border-color);
			border-radius: var(--pico-border-radius);
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: repeat(3, 1fr);
			background-color: black;
			width: 100%;
			aspect-ratio: 1 / 1;
			scrollbar-width: thin;
			scrollbar-gutter: stable;
			overflow-y: auto;

			& button {
				border-radius: var(--pico-border-radius);
				border: 2px solid black;

				&:focus-visible,
				&[data-selected='true'] {
					border: 2px solid var(--pico-primary);
				}
			}
		}

		& img {
			border-radius: var(--pico-border-radius);
			width: 100%;
			height: 100%;
		}
	}

	small {
		color: var(--pico-muted-color);
	}
</style>
