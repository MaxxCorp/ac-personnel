<script lang="ts">
	import { page } from "$app/state";
	import { locales, localizeHref } from "$lib/paraglide/runtime";
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import AuthHeader from "$lib/components/AuthHeader.svelte";
	import { Toaster } from "svelte-sonner";

	let { data, children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<AuthHeader />

{@render children()}
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
<Toaster />
