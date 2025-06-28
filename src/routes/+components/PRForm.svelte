<script lang="ts">
	import { page } from '$app/state';
	import { Tabs } from 'bits-ui';
	import { viewer } from '../+states/viewer-state.svelte';
	import { handleInputChange, createAvifLink } from '$lib/utilities';

	interface Props {
		submitting: boolean;
		shorthandName: string;
	}

	let { submitting, shorthandName }: Props = $props();

	let { form, data } = $derived(page);
	let updateType = $state('existing');

	async function downloadFile(type: string) {
		const link = document.createElement('a');
		const name = shorthandName.length > 0 ? shorthandName.toLowerCase() : 'badge';

		switch (type) {
			case 'gif':
				link.href = viewer.gif.url ?? '';
				link.download = `${name}.gif`;
				link.click();
				break;
			case 'png':
				link.href = viewer.selectedImage?.url ?? '';
				link.download = `${name}.png`;
				link.click();
				break;
			case 'avif':
				const avifUrl = await createAvifLink(viewer.selectedImage?.url ?? '');

				link.href = avifUrl;
				link.download = `${name}.avif`;
				link.click();

				URL.revokeObjectURL(avifUrl);
				break;
		}

		link.remove();
	}
</script>

<section>
	<h2>Pull Request</h2>
	<div class="flex-container">
		<Tabs.Root value="automatic">
			<Tabs.List>
				{#snippet child()}
					<div class="tablist-container">
						<div class="tablist">
							<Tabs.Trigger value="automatic">
								{#snippet child({ props })}
									<div class="tab">
										<button class="btn-reset" {...props}>Automatic</button>
									</div>
								{/snippet}
							</Tabs.Trigger>
							<Tabs.Trigger value="manual">
								{#snippet child({ props })}
									<div class="tab">
										<button class="btn-reset" {...props}>Manual</button>
									</div>
								{/snippet}
							</Tabs.Trigger>
						</div>
					</div>
				{/snippet}
			</Tabs.List>
			<Tabs.Content value="automatic">
				<p>Automatically create and update Pull Requests</p>
				<hr />
				{#if data.loggedIn}
					<h3>Checklist</h3>
					<fieldset>
						<label class="disabled">
							<input type="checkbox" form="badge" checked={!!viewer.gif.url} required />
							<span>GIF generated</span>
						</label>
						<label class="disabled">
							<input type="checkbox" form="badge" checked={!!viewer.selectedImage?.url} required />
							<span>Image selected</span>
						</label>
						<label>
							<input type="checkbox" form="badge" required />
							<span>Model centered vertically and horizontally</span>
						</label>
						<label>
							<input type="checkbox" form="badge" required />
							<span>Model zoomed in to minimize empty space</span>
						</label>
					</fieldset>
					<h3>Create New</h3>
					<button
						type="submit"
						form="badge"
						formaction="?/createPR"
						aria-busy={submitting}
						disabled={submitting}>Create New Pull Request</button
					>
					{#if form && form.for === 'create' && !submitting}
						{#if !form.success}
							<aside class="alert form-margin" aria-label="warning">
								<p>{form.message}</p>
							</aside>
						{:else}
							<aside class="success form-margin" aria-label="success">
								<p>Pull Request created! <a href={form.message} target="_blank">View PR</a></p>
							</aside>
						{/if}
					{/if}
					<h3>Update Existing</h3>
					<label>
						Pull Request <span class="required">*</span>
						<input
							name="prUrl"
							type="url"
							minlength="43"
							maxlength="50"
							pattern="https://github.com/.+"
							placeholder="https://github.com/Sendouc/sendou.ink/pull/1"
							autocomplete="off"
							autocorrect="off"
							form="badge"
							onchange={(e) => handleInputChange(e)}
						/>
					</label>
					<fieldset>
						<input
							name="updateType"
							id="existing"
							type="radio"
							value="existing"
							form="badge"
							bind:group={updateType}
						/>
						<label for="existing">Update badge</label>

						<input
							name="updateType"
							id="new"
							type="radio"
							value="new"
							form="badge"
							bind:group={updateType}
						/>
						<label for="new">Add badge</label>
					</fieldset>
					<label>
						Existing Shorthand Name <span class="required">*</span>
						<input
							name="updateName"
							type="text"
							minlength="5"
							maxlength="50"
							pattern="^[a-zA-Z0-9]+$"
							autocomplete="off"
							autocorrect="off"
							form="badge"
							onchange={(e) => handleInputChange(e)}
							aria-invalid={updateType === 'new' ? null : undefined}
							disabled={updateType === 'new'}
						/>
						<small>Shorthand name of the badge you want to update from the PR</small>
					</label>
					<button
						type="submit"
						form="badge"
						formaction="?/updatePR"
						aria-busy={submitting}
						disabled={submitting}>Update Pull Request</button
					>
					{#if form && form.for === 'update' && !submitting}
						{#if !form.success}
							<aside class="alert form-margin" aria-label="warning">
								<p>{form.message}</p>
							</aside>
						{:else}
							<aside class="success form-margin" aria-label="success">
								<p>Pull Request updated! <a href={form.message} target="_blank">View PR</a></p>
							</aside>
						{/if}
					{/if}
					<hr />
					<p>
						<span>Logged in as <a href={data.url} target="_blank">{data.name}</a></span>
						<span>•</span>
						<span>
							<a href="/logout">Logout</a>
						</span>
						<span>•</span>
						<span>
							<a href="https://github.com/Sendouc/sendou.ink/pulls" target="_blank">View all PRs</a>
						</span>
					</p>
				{:else}
					<a href="/login" role="button">Login With GitHub</a>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="manual">
				<p>Download the badge files to create a Pull Request manually</p>
				<hr />
				<h3>Download</h3>
				<fieldset class="grid">
					<button onclick={() => downloadFile('gif')} disabled={!viewer.gif.url}
						>Download GIF</button
					>
					<button onclick={() => downloadFile('png')} disabled={!viewer.selectedImage?.url}
						>Download PNG</button
					>
					<button onclick={() => downloadFile('avif')} disabled={!viewer.selectedImage?.url}
						>Download AVIF</button
					>
				</fieldset>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</section>

<style>
	.disabled {
		pointer-events: none;

		& input {
			opacity: var(--pico-form-element-disabled-opacity);
		}
	}
</style>
