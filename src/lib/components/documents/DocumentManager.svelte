<script lang="ts">
    import {
        getEntityDocuments,
        deleteEntityDocument,
    } from "../../../routes/api/documents.remote";
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Trash2, FileText, Download } from "@lucide/svelte";
    import { Separator } from "$lib/components/ui/separator";
    import FileUploader from "./FileUploader.svelte";

    let {
        entityType,
        entityId,
    }: { entityType: "applicant" | "employee"; entityId: number } = $props();

    // Types
    // @ts-ignore
    type Document = Awaited<ReturnType<typeof getEntityDocuments>>[number];

    let documents: Document[] = $state([]);
    let loading = $state(true);
    let error = $state("");

    async function loadDocuments() {
        loading = true;
        try {
            // @ts-ignore
            documents = await (getEntityDocuments as any)(entityType, entityId);
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadDocuments();
    });

    async function handleDelete(id: number) {
        if (!confirm("Are you sure? This will delete all versions.")) return;
        try {
            // @ts-ignore
            await (deleteEntityDocument as any)(id);
            await loadDocuments();
        } catch (e: any) {
            alert(e.message);
        }
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold">Documents</h2>
        <Button variant="outline" onclick={loadDocuments}>Refresh</Button>
    </div>

    <!-- Upload Section -->
    <FileUploader {entityType} {entityId} onUploadComplete={loadDocuments} />

    <Separator />

    <!-- Document List -->
    {#if loading}
        <div>Loading documents...</div>
    {:else if error}
        <div class="text-red-500">{error}</div>
    {:else if documents.length === 0}
        <div class="text-muted-foreground">No documents found.</div>
    {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each documents as doc (doc.id)}
                <Card.Root>
                    <Card.Header class="pb-2">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center space-x-2">
                                <FileText class="h-5 w-5 text-blue-500" />
                                <Card.Title class="text-base"
                                    >{doc.name}</Card.Title
                                >
                            </div>
                            <Badge variant="outline">{doc.type}</Badge>
                        </div>
                        <Card.Description>
                            Latest: {new Date(
                                doc.updatedAt,
                            ).toLocaleDateString()}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div class="text-sm text-muted-foreground mb-4">
                            ID: {doc.id}
                        </div>

                        <!-- Versions / Branches -->
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                            {#each doc.versions as ver}
                                <div
                                    class="flex items-center justify-between text-xs bg-muted p-2 rounded"
                                >
                                    <div class="flex flex-col">
                                        <span class="font-medium"
                                            >v{ver.version} ({ver.branch})</span
                                        >
                                        <span class="text-muted-foreground"
                                            >{new Date(
                                                ver.createdAt,
                                            ).toLocaleDateString()}</span
                                        >
                                    </div>
                                    <div class="flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="h-6 w-6"
                                            href={ver.url}
                                            target="_blank"
                                        >
                                            <Download class="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <div class="mt-4 flex justify-end">
                            <Button
                                variant="destructive"
                                size="sm"
                                onclick={() => handleDelete(doc.id)}
                            >
                                <Trash2 class="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </div>
                    </Card.Content>
                </Card.Root>
            {/each}
        </div>
    {/if}
</div>
