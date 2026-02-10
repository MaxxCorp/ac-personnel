<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        requestAbsence,
        getEmployeeAbsences,
    } from "../../../routes/api/absences.remote";
    import { onMount } from "svelte";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import * as Select from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";

    let { employeeId }: { employeeId: number } = $props();

    // @ts-ignore
    type Absence = Awaited<ReturnType<typeof getEmployeeAbsences>>[number];

    let absences: Absence[] = $state([]);
    let loading = $state(true);

    // Form State
    let type = $state("vacation");
    let startDate = $state("");
    let endDate = $state("");
    let reason = $state("");

    const types = [
        { value: "vacation", label: "Vacation" },
        { value: "sick", label: "Sick Leave" },
        { value: "other", label: "Other" },
    ];

    async function loadAbsences() {
        loading = true;
        try {
            // @ts-ignore
            absences = await getEmployeeAbsences(employeeId);
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadAbsences();
    });

    async function handleSubmit() {
        if (!startDate || !endDate) {
            alert("Please select dates");
            return;
        }
        try {
            await (requestAbsence as unknown as Function)(
                employeeId,
                new Date(startDate),
                new Date(endDate),
                type,
                reason,
            );
            startDate = "";
            endDate = "";
            reason = "";
            await loadAbsences();
        } catch (e: any) {
            alert(e.message);
        }
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium">Absences</h3>
    </div>

    <Card.Root class="p-4">
        <h4 class="text-sm font-medium mb-4">Request Time Off</h4>
        <div class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label>Type</Label>
                    <Select.Root type="single" bind:value={type}>
                        <Select.Trigger
                            >{types.find((t) => t.value === type)
                                ?.label}</Select.Trigger
                        >
                        <Select.Content>
                            {#each types as t}
                                <Select.Item value={t.value}
                                    >{t.label}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>
            <div class="grid gap-2">
                <div class="grid gap-2">
                    <Label for="abs-start">Start Date</Label>
                    <Input id="abs-start" type="date" bind:value={startDate} />
                </div>
                <div class="grid gap-2">
                    <Label for="abs-end">End Date</Label>
                    <Input id="abs-end" type="date" bind:value={endDate} />
                </div>
            </div>
            <div class="grid gap-2">
                <Label for="abs-reason">Reason</Label>
                <Textarea id="abs-reason" bind:value={reason} />
            </div>
            <Button onclick={handleSubmit}>Submit Request</Button>
        </div>
    </Card.Root>

    <div class="space-y-4 pt-4">
        <h4 class="text-sm font-medium">History</h4>
        {#if loading}
            <div>Loading...</div>
        {:else if absences.length === 0}
            <div class="text-muted-foreground text-sm">No absence history.</div>
        {:else}
            {#each absences as abs}
                <Card.Root class="flex items-center justify-between p-4">
                    <div class="flex flex-col">
                        <span class="font-medium capitalize">{abs.type}</span>
                        <span class="text-xs text-muted-foreground">
                            {new Date(abs.startDate).toLocaleDateString()} - {new Date(
                                abs.endDate,
                            ).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="flex items-center gap-4">
                        <Badge
                            variant={abs.status === "approved"
                                ? "default"
                                : abs.status === "rejected"
                                  ? "destructive"
                                  : "secondary"}
                        >
                            {abs.status}
                        </Badge>
                    </div>
                </Card.Root>
            {/each}
        {/if}
    </div>
</div>
