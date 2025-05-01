<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog, type WithoutChild } from 'bits-ui';

	type Props = Dialog.RootProps & {
		buttonText: string;
		contentProps?: WithoutChild<Dialog.ContentProps>;
		title: Snippet;
		description: Snippet;
	};

	let {
		buttonText,
		contentProps,
		open = $bindable(false),
		title,
		description,
		children,
		...restProps
	}: Props = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Trigger>
		{buttonText}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay>
			{#snippet child({ props })}
				<div class="overlay" {...props}></div>
			{/snippet}
		</Dialog.Overlay>
		<Dialog.Content {...contentProps}>
			{#snippet child({ props })}
				<div class="content" {...props}>
					<Dialog.Title>
						{#snippet child({ props })}
							<h2 {...props}>{@render title()}</h2>
						{/snippet}
					</Dialog.Title>
					<Dialog.Description>
						{#snippet child({ props })}
							<div class="description" {...props}>{@render description()}</div>
						{/snippet}
					</Dialog.Description>
					{@render children?.()}
					<Dialog.Close>Close</Dialog.Close>
				</div>
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(5px);
		z-index: 50;
	}

	.content {
		background-color: var(--pico-background-color);
		border: 1px solid var(--pico-form-element-border-color);
		border-radius: var(--pico-border-radius);
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 950px;
		max-height: 90%;
		padding: 1rem;
		overflow: auto;
		z-index: 50;
	}

	.description {
		margin-bottom: 1rem;
	}
</style>
