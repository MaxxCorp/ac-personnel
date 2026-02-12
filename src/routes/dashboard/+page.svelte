<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { getDashboardRedirect } from "../api/dashboard.remote";
    import * as Card from "$lib/components/ui/card";
    import { Users, FileText, Clock, UserPlus } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";

    let loading = $state(true);
    let showDashboard = $state(false);

    onMount(async () => {
        try {
            // @ts-ignore
            const url = await getDashboardRedirect();
            if (url && url !== window.location.pathname) {
                goto(url);
            } else {
                showDashboard = true;
            }
        } catch (e) {
            console.error(e);
            // Fallback for error - maybe show dashboard anyway or simplified view
            showDashboard = true;
        } finally {
            loading = false;
        }
    });

    const navItems = [
        {
            title: "Employees",
            href: "/admin/employees",
            icon: Users,
            desc: "Manage staff, roles, and documents.",
        },
        {
            title: "Applicants",
            href: "/admin/recruiting",
            icon: UserPlus,
            desc: "Review and track job applications.",
        }, // Assuming path
        {
            title: "Time Tracking",
            href: "/time",
            icon: Clock,
            desc: "View attendance and time logs.",
        }, // Assuming path
        {
            title: "Documents",
            href: "/admin/documents",
            icon: FileText,
            desc: "Global document management.",
        }, // Assuming path
    ];
</script>

{#if loading}
    <div class="flex items-center justify-center min-h-screen">
        <div class="animate-pulse flex flex-col items-center">
            <div class="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
            <div class="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
    </div>
{:else if showDashboard}
    <div class="p-8 space-y-8">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p class="text-muted-foreground">
                Welcome to AC Personnel Administration.
            </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {#each navItems as item}
                <a href={item.href} class="block h-full">
                    <Card.Root
                        class="h-full hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                        <Card.Header
                            class="flex flex-row items-center justify-between space-y-0 pb-2"
                        >
                            <Card.Title class="text-sm font-medium">
                                {item.title}
                            </Card.Title>
                            <item.icon class="h-4 w-4 text-muted-foreground" />
                        </Card.Header>
                        <Card.Content>
                            <div class="text-xs text-muted-foreground">
                                {item.desc}
                            </div>
                        </Card.Content>
                    </Card.Root>
                </a>
            {/each}
        </div>
    </div>
{/if}
