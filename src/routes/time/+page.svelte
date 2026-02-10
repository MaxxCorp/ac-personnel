<script lang="ts">
    import TimeTracker from "$lib/components/time/TimeTracker.svelte";
    import AbsenceRequestForm from "$lib/components/time/AbsenceRequestForm.svelte";
    import ManagerTimeDashboard from "$lib/components/time/ManagerTimeDashboard.svelte";
    import { page } from "$app/state";
    import * as Tabs from "$lib/components/ui/tabs";
    import { getEmployees } from "../api/employees.remote";

    let { data } = $props();
    let user = $derived(data.session?.user);
    // We need employee ID for the tracker.
    // If user is employee, we need to find their employee record.
    // We can fetch this server-side or via remote function.
    // Let's use remote function on mount or pass via load function.
    // For now, let's assume we can get it via a remote call or simpler,
    // let's make `TimeTracker` accept `userId` and resolve `employeeId` internally?
    // Or pass `employeeId` from server load.
    // Since we are in client component, let's fetch it.

    // Actually, `TimeTracker` expects `employeeId`.
    // Let's resolve it here.

    let employeeId: number | null = $state(null);
    let isManager = $derived(
        ["admin", "manager", "talentManagement"].includes(user?.role || ""),
    );

    $effect(() => {
        if (user) {
            // Fetch employee ID for current user
            // @ts-ignore
            getEmployees()
                .then((emps) => {
                    // @ts-ignore
                    const match = emps.find((e) => e.userId === user.id);
                    if (match) employeeId = match.id;
                })
                .catch(console.error);
        }
    });
</script>

<div class="container py-10">
    <h1 class="text-3xl font-bold mb-6">Time & Absences</h1>

    {#if !employeeId && !isManager}
        <div>Loading profile...</div>
    {:else}
        <Tabs.Root value="my-time" class="w-full">
            <Tabs.List>
                <Tabs.Trigger value="my-time">My Time</Tabs.Trigger>
                <Tabs.Trigger value="absences">Absences</Tabs.Trigger>
                {#if isManager}
                    <Tabs.Trigger value="approvals">Approvals</Tabs.Trigger>
                {/if}
            </Tabs.List>
            <Tabs.Content value="my-time" class="py-4">
                {#if employeeId}
                    <TimeTracker {employeeId} />
                {:else}
                    <div class="text-muted-foreground">
                        Employee record not found.
                    </div>
                {/if}
            </Tabs.Content>
            <Tabs.Content value="absences" class="py-4">
                {#if employeeId}
                    <AbsenceRequestForm {employeeId} />
                {:else}
                    <div class="text-muted-foreground">
                        Employee record not found.
                    </div>
                {/if}
            </Tabs.Content>
            {#if isManager}
                <Tabs.Content value="approvals" class="py-4">
                    <ManagerTimeDashboard />
                </Tabs.Content>
            {/if}
        </Tabs.Root>
    {/if}
</div>
