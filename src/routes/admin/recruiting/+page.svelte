<script lang="ts">
    import {
        getApplicants,
        updateApplicantStatus,
    } from "../../api/applicants.remote";
    import { onMount } from "svelte";
    import { flip } from "svelte/animate";
    // @ts-ignore
    import { dndzone } from "svelte-dnd-action";
    import * as Card from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import * as Sheet from "$lib/components/ui/sheet";
    import DocumentManager from "$lib/components/documents/DocumentManager.svelte";

    // Type definitons
    // @ts-ignore
    type Applicant = Awaited<ReturnType<typeof getApplicants>>[number];
    type Status = Applicant["status"];

    const COLUMNS: { id: Status; title: string }[] = [
        { id: "applied", title: "Applied" },
        { id: "screening", title: "Screening" },
        { id: "interview", title: "Interview" },
        { id: "offer", title: "Offer" },
        { id: "hired", title: "Hired" },
        { id: "rejected", title: "Rejected" },
    ];

    // State
    let applicants: Applicant[] = $state([]);
    let columnsData: Record<Status, Applicant[]> = $state({
        applied: [],
        screening: [],
        interview: [],
        offer: [],
        hired: [],
        rejected: [],
        withdrawn: [], // withdrawn is a valid status
    } as Record<Status, Applicant[]>);
    let loading = $state(true);
    let selectedApplicant: Applicant | null = $state(null);
    let sheetOpen = $state(false);

    function openApplicant(app: Applicant) {
        selectedApplicant = app;
        sheetOpen = true;
    }

    // Fetch data using Remote Function
    onMount(async () => {
        try {
            // @ts-ignore
            applicants = await getApplicants();
            distributeApplicants();
        } catch (e) {
            console.error("Failed to load applicants", e);
        } finally {
            loading = false;
        }
    });

    function distributeApplicants() {
        const newCols: any = {
            applied: [],
            screening: [],
            interview: [],
            offer: [],
            hired: [],
            rejected: [],
            withdrawn: [],
        };
        applicants.forEach((app) => {
            if (newCols[app.status]) {
                newCols[app.status].push(app);
            }
        });
        columnsData = newCols;
    }

    function handleDndConsider(e: any, status: Status) {
        columnsData[status] = e.detail.items;
    }

    async function handleDndFinalize(e: any, status: Status) {
        const items = e.detail.items;
        columnsData[status] = items;

        // Identify if an item was dropped here from another column
        // In a real app, we'd optimistically update and then sync.
        // For simplicity, we just update the status of the item that changed.

        // Find item that has wrong status
        const movedItem = items.find((i: Applicant) => i.status !== status);
        if (movedItem) {
            movedItem.status = status;
            // Update local state to reflect new status immediately
            // @ts-ignore
            await updateApplicantStatus(movedItem.id, status);
        }
    }
</script>

<div class="p-8 h-full">
    <div class="flex items-center justify-between space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Recruiting Pipeline</h2>
        <div class="flex items-center space-x-2">
            <Button>Add Applicant</Button>
        </div>
    </div>
    <Separator class="my-4" />

    {#if loading}
        <div class="flex justify-center p-8">Loading pipeline...</div>
    {:else}
        <div class="flex h-[calc(100vh-200px)] overflow-x-auto gap-4 pb-4">
            {#each COLUMNS as col (col.id)}
                <div class="flex flex-col w-80 shrink-0">
                    <div
                        class="mb-3 font-semibold flex items-center justify-between"
                    >
                        {col.title}
                        <Badge variant="secondary"
                            >{columnsData[col.id].length}</Badge
                        >
                    </div>

                    <div
                        class="flex-1 bg-muted/50 rounded-lg p-2 flex flex-col gap-2 overflow-y-auto"
                        use:dndzone={{
                            items: columnsData[col.id],
                            flipDurationMs: 300,
                            dropTargetStyle: { outline: "none" },
                        }}
                        onconsider={(e: any) => handleDndConsider(e, col.id)}
                        onfinalize={(e: any) => handleDndFinalize(e, col.id)}
                    >
                        {#each columnsData[col.id] as applicant (applicant.id)}
                            <div animate:flip={{ duration: 300 }}>
                                <Card.Root
                                    class="cursor-grab active:cursor-grabbing bg-background hover:border-black/50 transition-colors"
                                    onclick={() => openApplicant(applicant)}
                                >
                                    <Card.Header class="p-4 pb-2">
                                        <Card.Title class="text-sm font-medium"
                                            >{applicant.name}</Card.Title
                                        >
                                        <Card.Description class="text-xs"
                                            >{applicant.email}</Card.Description
                                        >
                                    </Card.Header>
                                    <Card.Content
                                        class="p-4 pt-0 text-xs text-muted-foreground"
                                    >
                                        {new Date(
                                            applicant.createdAt,
                                        ).toLocaleDateString()}
                                    </Card.Content>
                                </Card.Root>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <Sheet.Root bind:open={sheetOpen}>
        <Sheet.Content class="w-[600px] sm:max-w-xl overflow-y-auto">
            <Sheet.Header>
                <Sheet.Title>Applicant Details</Sheet.Title>
                <Sheet.Description>
                    Manage documents and details for {selectedApplicant?.name}
                </Sheet.Description>
            </Sheet.Header>

            {#if selectedApplicant}
                <div class="py-6">
                    <DocumentManager
                        entityType="applicant"
                        entityId={selectedApplicant.id}
                    />
                </div>
            {/if}
        </Sheet.Content>
    </Sheet.Root>
</div>
