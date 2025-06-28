<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { viewer } from './+states/viewer-state.svelte.js';
	import { createAvifLink } from '$lib/utilities.js';
	import Viewer from './+components/viewer/Viewer.svelte';
	import DataForm from './+components/DataForm.svelte';
	import PRForm from './+components/PRForm.svelte';

	let shorthandName = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
		e.preventDefault();
		submitting = true;

		const formData = new FormData(e.currentTarget);

		const avifUrl = await createAvifLink(viewer.selectedImage?.url ?? '');
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
<PRForm {shorthandName} {submitting} />
