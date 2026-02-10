<script lang="ts">
    import {
        getUserNotifications,
        markNotificationRead,
    } from "../../../routes/api/notifications.remote";
    import { onMount } from "svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import { Bell } from "@lucide/svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { enhance } from "$app/forms";

    // @ts-ignore
    // @ts-ignore
    type Notification = {
        id: number;
        createdAt: Date;
        userId: string;
        type: "info" | "warning" | "success" | "error";
        message: string;
        read: boolean;
        relatedEntityType: string | null;
        relatedEntityId: number | null;
    };

    let notifications: Notification[] = $state([]);
    let unreadCount = $derived(notifications.filter((n) => !n.read).length);

    async function loadNotifications() {
        try {
            // @ts-ignore
            notifications = await getUserNotifications();
        } catch (e) {
            console.error(e);
        }
    }

    onMount(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    });
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        <Button variant="ghost" size="icon" class="relative">
            <Bell class="h-5 w-5" />
            {#if unreadCount > 0}
                <span
                    class="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"
                ></span>
            {/if}
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-80">
        <DropdownMenu.Label>Notifications</DropdownMenu.Label>
        <DropdownMenu.Separator />
        {#if notifications.length === 0}
            <div class="p-4 text-center text-sm text-muted-foreground">
                No notifications
            </div>
        {:else}
            <div class="max-h-[300px] overflow-y-auto">
                {#each notifications as notification}
                    <form
                        method="POST"
                        action={markNotificationRead as unknown as string}
                        use:enhance={() => {
                            // Optimistic update
                            const n = notifications.find(
                                (n) => n.id === notification.id,
                            );
                            if (n) n.read = true;
                            return async ({ result }) => {
                                // Handle result if needed
                                if (result.type === "error") {
                                    // Revert optimistic update?
                                    if (n) n.read = false;
                                }
                            };
                        }}
                    >
                        <input
                            type="hidden"
                            name="notificationId"
                            value={notification.id}
                        />
                        <DropdownMenu.Item
                            class="flex flex-col items-start gap-1 p-3 cursor-pointer {notification.read
                                ? 'opacity-50'
                                : ''}"
                            asChild
                        >
                            <button type="submit" class="w-full text-left">
                                <div class="flex items-center gap-2 w-full">
                                    <Badge
                                        variant={notification.type === "error"
                                            ? "destructive"
                                            : notification.type === "success"
                                              ? "default"
                                              : "secondary"}
                                        class="text-[10px] h-4 px-1 capitalize"
                                    >
                                        {notification.type}
                                    </Badge>
                                    <span
                                        class="text-xs text-muted-foreground ml-auto"
                                    >
                                        {new Date(
                                            notification.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <p class="text-sm leading-snug">
                                    {notification.message}
                                </p>
                            </button>
                        </DropdownMenu.Item>
                    </form>
                {/each}
            </div>
        {/if}
    </DropdownMenu.Content>
</DropdownMenu.Root>
