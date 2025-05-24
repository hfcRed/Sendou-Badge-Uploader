<div class="ruler">
	<div class="horizontal">
		{#each { length: 5 }}
			<div class="big"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="medium"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
		{/each}
		<div class="big"></div>
	</div>
	<div class="vertical">
		{#each { length: 5 }}
			<div class="big"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="medium"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
			<div class="small"></div>
		{/each}
		<div class="big"></div>
	</div>
</div>

<style>
	.ruler {
		position: absolute;
		inset: 0;
		aspect-ratio: 1 / 1;

		.horizontal {
			position: absolute;
			top: calc(50% - 7.5px);
			left: 0;
			display: flex;
			justify-content: space-around;
			width: 100%;

			.big {
				width: 1.5px;
				height: 15px;
			}
			.medium {
				width: 1.5px;
				height: 10px;
				margin-top: 2.5px;
			}
			.small {
				width: 1px;
				height: 5px;
				margin-top: 5px;
			}
		}

		.vertical {
			position: absolute;
			top: 0;
			left: calc(50% - 7.5px);
			display: flex;
			flex-direction: column;
			justify-content: space-around;
			height: 100%;

			.big {
				width: 15px;
				height: 1.5px;
			}
			.medium {
				width: 10px;
				height: 1.5px;
				margin-left: 2.5px;
			}
			.small {
				width: 5px;
				height: 1px;
				margin-left: 5px;
			}
		}

		.small,
		.medium,
		.big {
			background-color: white;
			filter: drop-shadow(0 0 1px black);
		}
	}
</style>
