<script lang="ts">
    import {
        getPendingTimeEntries,
        updateTimeEntryStatus,
    } from "../../../routes/api/time-tracking.remote";
    import {
        getPendingAbsenceRequests,
        updateAbsenceStatus,
    } from "../../../routes/api/absences.remote";
    import { getAllEmployees } from "../../../routes/api/employees.remote";
    import { onMount } from "svelte";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Check, X } from "@lucide/svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";

    // @ts-ignore
    type TimeEntry = Awaited<ReturnType<typeof getPendingTimeEntries>>[number];
    // @ts-ignore
    type Absence = Awaited<
        ReturnType<typeof getPendingAbsenceRequests>
    >[number];
    // @ts-ignore
    type Employee = Awaited<ReturnType<typeof getAllEmployees>>[number];

    let timeEntries: TimeEntry[] = $state([]);
    let absences: Absence[] = $state([]);
    let employees: Record<number, Employee> = $state({});
    let loading = $state(true);

    // Approval/Rejection State
    let selectedItem: { type: "time" | "absence"; id: number } | null =
        $state(null);
    let actionType: "approve" | "reject" | null = $state(null);
    let note = $state("");
    let dialogOpen = $state(false);

    async function loadData() {
        loading = true;
        try {
            // @ts-ignore
            // @ts-ignore
            const [t, a, eList] = await Promise.all([
                // @ts-ignore
                getPendingTimeEntries(),
                // @ts-ignore
                getPendingAbsenceRequests(),
                // @ts-ignore
                getAllEmployees(),
            ]);
            timeEntries = t;
            absences = a;
            // index employees by id
            employees = eList.reduce((acc: any, curr: any) => {
                acc[curr.id] = curr;
                return acc;
            }, {});
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    function openDialog(
        type: "time" | "absence",
        id: number,
        action: "approve" | "reject",
    ) {
        selectedItem = { type, id };
        actionType = action;
        note = "";
        dialogOpen = true;
    }

    async function handleConfirm() {
        if (!selectedItem || !actionType) return;
        const status = actionType === "approve" ? "approved" : "rejected";

        try {
            if (selectedItem.type === "time") {
                // @ts-ignore
                await updateTimeEntryStatus(selectedItem.id, status, note);
            } else {
                // @ts-ignore
                await updateAbsenceStatus(selectedItem.id, status, note);
            }
            dialogOpen = false;
            await loadData();
        } catch (e: any) {
            alert(e.message);
        }
    }
</script>

<div class="space-y-8">
    <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Approvals</h2>
        <Button variant="outline" onclick={loadData}>Refresh</Button>
    </div>

    <!-- Time Entries Section -->
    <div class="space-y-4">
        <h3 class="text-lg font-medium">Pending Time Entries</h3>
        {#if timeEntries.length === 0}
            <div class="text-muted-foreground">No pending time entries.</div>
        {:else}
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each timeEntries as entry}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title class="text-sm">
                                {employees[entry.employeeId]?.firstName}
                                {employees[entry.employeeId]?.lastName}
                            </Card.Title>
                            <Card.Description>
                                {new Date(entry.date).toLocaleDateString()}
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div class="text-sm">
                                {new Date(entry.startTime).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                )} -
                                {entry.endTime
                                    ? new Date(
                                          entry.endTime,
                                      ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "Active"}
                            </div>
                            {#if entry.notes}
                                <div
                                    class="text-xs text-muted-foreground mt-2 italic"
                                >
                                    "{entry.notes}"
                                </div>
                            {/if}
                        </Card.Content>
                        <Card.Footer class="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onclick={() =>
                                    openDialog("time", entry.id, "reject")}
                            >
                                <X class="h-4 w-4 text-destructive" />
                            </Button>
                            <Button
                                size="sm"
                                onclick={() =>
                                    openDialog("time", entry.id, "approve")}
                            >
                                <Check class="h-4 w-4" />
                            </Button>
                        </Card.Footer>
                    </Card.Root>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Absence Requests Section -->
    <div class="space-y-4">
        <h3 class="text-lg font-medium">Pending Absence Requests</h3>
        {#if absences.length === 0}
            <div class="text-muted-foreground">
                No pending absence requests.
            </div>
        {:else}
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each absences as abs}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title class="text-sm">
                                {employees[abs.employeeId]?.firstName}
                                {employees[abs.employeeId]?.lastName}
                            </Card.Title>
                            <Card.Description>
                                <Badge variant="secondary" class="capitalize"
                                    >{abs.type}</Badge
                                >
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div class="text-sm font-medium">
                                {new Date(abs.startDate).toLocaleDateString()} -
                                {new Date(abs.endDate).toLocaleDateString()}
                            </div>
                            {#if abs.reason}
                                <div
                                    class="text-xs text-muted-foreground mt-2 italic"
                                >
                                    "{abs.reason}"
                                </div>
                            {/if}
                        </Card.Content>
                        <Card.Footer class="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onclick={() =>
                                    openDialog("absence", abs.id, "reject")}
                            >
                                <X class="h-4 w-4 text-destructive" />
                            </Button>
                            <Button
                                size="sm"
                                onclick={() =>
                                    openDialog("absence", abs.id, "approve")}
                            >
                                <Check class="h-4 w-4" />
                            </Button>
                        </Card.Footer>
                    </Card.Root>
                {/each}
            </div>
        {/if}
    </div>

    <Dialog.Root bind:open={dialogOpen}>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title
                    >{actionType === "approve" ? "Approve" : "Reject"} Request</Dialog.Title
                >
                <Dialog.Description>
                    Add a note for the employee (optional).
                </Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="note">Note</Label>
                    <Textarea
                        id="note"
                        bind:value={note}
                        placeholder="Reason or comment..."
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button variant="outline" onclick={() => (dialogOpen = false)}
                    >Cancel</Button
                >
                <Button
                    variant={actionType === "reject"
                        ? "destructive"
                        : "default"}
                    onclick={handleConfirm}
                >
                    Confirm {actionType === "approve"
                        ? "Approval"
                        : "Rejection"}
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
