<script>
	import '../styles/normalize.css';
	import '../styles/pico.css';
	import '../styles/global.css';

	import Logo from '$lib/components/Logo.svelte';

	let { children } = $props();
</script>

<header>
	<nav class="container">
		<ul>
			<li class="logo"><Logo /><strong>Badge Uploader</strong></li>
		</ul>
		<ul>
			<li><a href="/">Upload</a></li>
			<li><a href="/resources">Resources</a></li>
		</ul>
	</nav>
</header>
<main class="container">
	{@render children()}
</main>
<footer>
	<div class="container">
		<p>Badge Uploader is not affiliated with Sendou or Sendou.ink in any way.</p>
		<div class="links">
			<a href="https://sendou.ink" target="_blank">Sendou</a>
			<span>•</span>
			<a href="https://github.com/hfcRed/Sendou-Badge-Uploader" target="_blank">Source Code</a>
		</div>
	</div>
</footer>

<style>
	header {
		border-bottom: 1px solid var(--pico-form-element-border-color);
	}

	footer {
		border-top: 1px solid var(--pico-form-element-border-color);
		font-size: 80%;
		text-align: center;

		p,
		span {
			color: var(--pico-muted-color);
		}

		> div {
			padding: var(--pico-nav-element-spacing-vertical) var(--pico-nav-element-spacing-horizontal);
		}
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
