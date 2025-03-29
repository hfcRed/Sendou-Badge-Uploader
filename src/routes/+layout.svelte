<script>
	import '../styles/normalize.css';
	import '../styles/pico.css';
	import '../styles/global.css';

	let { children } = $props();
</script>

<header>
	<div class="container">Sendou Badge Uploader</div>
</header>
<main class="container">
	{@render children()}
</main>
