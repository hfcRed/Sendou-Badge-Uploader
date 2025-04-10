<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { encode } from '@jsquash/avif';
	import { viewer } from '$lib/components/viewer/viewer-state.svelte.js';
	import Viewer from '$lib/components/viewer/Viewer.svelte';
	import DataForm from '$lib/components/form/DataForm.svelte';
	import PRForm from '$lib/components/form/PRForm.svelte';

	let shorthandName = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
		e.preventDefault();
		submitting = true;

		const formData = new FormData(e.currentTarget);

		const avifUrl = await createAvifLink();
		formData.set('gif', await createFileFromUrl(viewer.gif.url ?? '', 'gif', 'image/gif'));
		formData.set('avif', await createFileFromUrl(avifUrl, 'avif', 'image/avif'));
		formData.set(
			'png',
			await createFileFromUrl(viewer.selectedImage?.url ?? '', 'png', 'image/png')
		);

		const response = await fetch(e.submitter?.getAttribute('formaction') ?? '/', {
			method: 'POST',
			body: formData
		});
		const result = deserialize(await response.text());

		submitting = false;
		URL.revokeObjectURL(avifUrl);
		applyAction(result);
	}

	async function createAvifLink() {
		const img = document.createElement('img');
		img.src = viewer.selectedImage?.url || '';
		await new Promise((resolve) => (img.onload = resolve));

		const canvas = document.createElement('canvas');
		[canvas.width, canvas.height] = [img.width, img.height];
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0);

		const data = ctx.getImageData(0, 0, img.width, img.height);
		const avifBuffer = await encode(data);
		const avifBlob = new Blob([avifBuffer], { type: 'image/avif' });

		img.remove();
		canvas.remove();

		return URL.createObjectURL(avifBlob);
	}

	async function createFileFromUrl(url: string, extension: string, type: string): Promise<File> {
		const response = await fetch(url);
		const blob = await response.blob();
		return new File([blob], `${shorthandName.toLowerCase()}.${extension}`, { type });
	}
</script>

<form id="badge" method="POST" onsubmit={handleSubmit}></form>

<hgroup>
	<h1>Upload Badges</h1>
	<p>Generate badge files and create Pull Requests automatically</p>
</hgroup>
<hr />
<Viewer />
<hr />
<DataForm bind:shorthandName />
<hr />
<PRForm {shorthandName} {submitting} {createAvifLink} />
