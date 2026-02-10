<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        clockIn,
        clockOut,
        getEmployeeTimeEntries,
        submitTimeEntry,
    } from "../../../routes/api/time-tracking.remote";
    import { onMount } from "svelte";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Play, Square, Plus } from "@lucide/svelte";
    import { Badge } from "$lib/components/ui/badge";

    let { employeeId }: { employeeId: number } = $props();

    // @ts-ignore
    type TimeEntry = any;

    let entries: TimeEntry[] = $state([]);
    let loading = $state(true);
    let todayEntry: TimeEntry | null = $state(null);
    let manualEntryOpen = $state(false);

    // Manual Entry Form State
    let manualDate = $state(new Date().toISOString().split("T")[0]);
    let manualStart = $state("09:00");
    let manualEnd = $state("17:00");
    let manualBreak = $state(0);
    let manualNotes = $state("");

    async function loadEntries() {
        loading = true;
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last of month
        try {
            // @ts-ignore
            entries = await getEmployeeTimeEntries(employeeId, start, end);
            findTodayEntry();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function findTodayEntry() {
        const todayStr = new Date().toDateString();
        // @ts-ignore
        todayEntry =
            entries.find((e) => new Date(e.date).toDateString() === todayStr) ||
            null;
    }

    onMount(() => {
        loadEntries();
    });

    async function handleClockIn() {
        try {
            // @ts-ignore
            await clockIn(employeeId);
            await loadEntries();
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleClockOut() {
        try {
            // @ts-ignore
            await clockOut(employeeId);
            await loadEntries();
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleManualSubmit() {
        try {
            const dateObj = new Date(manualDate);
            const startObj = new Date(`${manualDate}T${manualStart}`);
            const endObj = new Date(`${manualDate}T${manualEnd}`);

            // @ts-ignore
            await submitTimeEntry(
                employeeId,
                dateObj,
                startObj,
                endObj,
                manualBreak,
                manualNotes,
            );
            manualEntryOpen = false;
            await loadEntries();
        } catch (e: any) {
            alert(e.message);
        }
    }

    // Derived state for current status
    let isClockedIn = $derived(todayEntry && !todayEntry.endTime);
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Time Tracking</h3>
        <div class="flex gap-2">
            {#if !isClockedIn}
                <Button
                    onclick={handleClockIn}
                    disabled={!!todayEntry?.endTime}
                >
                    <Play class="mr-2 h-4 w-4" /> Clock In
                </Button>
            {:else}
                <Button variant="destructive" onclick={handleClockOut}>
                    <Square class="mr-2 h-4 w-4" /> Clock Out
                </Button>
            {/if}
            <Button
                variant="outline"
                onclick={() => (manualEntryOpen = !manualEntryOpen)}
            >
                <Plus class="mr-2 h-4 w-4" /> Manual Entry
            </Button>
        </div>
    </div>

    {#if manualEntryOpen}
        <Card.Root class="p-4 border-dashed">
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="date">Date</Label>
                        <Input id="date" type="date" bind:value={manualDate} />
                    </div>
                    <div class="grid gap-2">
                        <Label for="break">Break (min)</Label>
                        <Input
                            id="break"
                            type="number"
                            bind:value={manualBreak}
                        />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="start">Start Time</Label>
                        <Input
                            id="start"
                            type="time"
                            bind:value={manualStart}
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="end">End Time</Label>
                        <Input id="end" type="time" bind:value={manualEnd} />
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label for="notes">Notes</Label>
                    <Textarea id="notes" bind:value={manualNotes} />
                </div>
                <Button onclick={handleManualSubmit}>Submit Entry</Button>
            </div>
        </Card.Root>
    {/if}

    <div class="space-y-4">
        {#if loading}
            <div>Loading entries...</div>
        {:else if entries.length === 0}
            <div class="text-muted-foreground text-sm">
                No entries for this month.
            </div>
        {:else}
            {#each entries as entry}
                <Card.Root class="flex items-center justify-between p-4">
                    <div class="flex flex-col">
                        <span class="font-medium"
                            >{new Date(entry.date).toLocaleDateString()}</span
                        >
                        <span class="text-xs text-muted-foreground">
                            {new Date(entry.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })} -
                            {entry.endTime
                                ? new Date(entry.endTime).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                  )
                                : "Active"}
                        </span>
                    </div>
                    <div class="flex items-center gap-4">
                        {#if (entry.breakDuration || 0) > 0}
                            <Badge variant="outline"
                                >{entry.breakDuration}m break</Badge
                            >
                        {/if}
                        <Badge
                            variant={entry.status === "approved"
                                ? "default"
                                : entry.status === "rejected"
                                  ? "destructive"
                                  : "secondary"}
                        >
                            {entry.status}
                        </Badge>
                    </div>
                </Card.Root>
            {/each}
        {/if}
    </div>
</div>
