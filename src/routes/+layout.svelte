<script lang="ts">
	import { page } from "$app/state";
	import { locales, localizeHref } from "$lib/paraglide/runtime";
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import NotificationCenter from "$lib/components/ui/NotificationCenter.svelte";

	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { authClient } from "$lib/auth-client";
	import { toast } from "svelte-sonner";

	let { data, children } = $props();

	let email = $state("");
	let isLoading = $state(false);
	let isLoginOpen = $state(false);

	async function handleSignIn() {
		isLoading = true;
		await authClient.signIn.magicLink(
			{
				email,
				callbackURL: "/dashboard", // Redirect to dashboard or home
			},
			{
				onSuccess: () => {
					toast.success("Magic link sent! Check your inbox.");
					isLoginOpen = false;
					isLoading = false;
				},
				onError: (ctx: any) => {
					toast.error(ctx.error.message);
					isLoading = false;
				},
			},
		);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Header/Navigation -->
<header class="flex items-center justify-between px-6 py-4 border-b">
	<div class="font-bold text-xl">AC Personnel</div>
	<div class="flex items-center gap-4">
		{#if data.session}
			<NotificationCenter />
			<div class="text-sm">
				{data.session.user.name || data.session.user.email}
			</div>
		{:else}
			<Dialog.Root bind:open={isLoginOpen}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Sign In</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Sign In</Dialog.Title>
						<Dialog.Description>
							Enter your email to sign in via Magic Link.
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-4 py-4">
						<div class="grid gap-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								bind:value={email}
								placeholder="name@example.com"
								type="email"
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Button onclick={handleSignIn} disabled={isLoading}>
							{#if isLoading}
								Sending...
							{:else}
								Sign In with Email
							{/if}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</div>
</header>

{@render children()}
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
