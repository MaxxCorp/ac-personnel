<script module lang="ts">
    import { uploadDocument } from "../../../routes/api/documents.remote";
</script>

<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Upload } from "@lucide/svelte";
    import * as Select from "$lib/components/ui/select";

    let {
        entityType,
        entityId,
        onUploadComplete = () => {},
    }: {
        entityType: "applicant" | "employee";
        entityId: number;
        onUploadComplete?: () => void;
    } = $props();

    let file: File | null = $state(null);
    let type = $state("other");
    let branch = $state("main");
    let uploading = $state(false);

    // Document Types
    const types = [
        { value: "resume", label: "Resume" },
        { value: "contract", label: "Contract" },
        { value: "id_proof", label: "ID Proof" },
        { value: "other", label: "Other" },
    ];

    let selectedLabel = $derived(
        types.find((t) => t.value === type)?.label || "Select type",
    );

    async function handleUpload() {
        if (!file) return;
        uploading = true;

        try {
            await import("../../../routes/api/documents.remote").then((m) =>
                (m as any).uploadDocument(
                    entityType,
                    entityId,
                    file,
                    type,
                    branch,
                ),
            );
            onUploadComplete();
            file = null;
        } catch (e: any) {
            console.error("Upload failed", e);
            alert("Upload failed: " + e.message);
        } finally {
            uploading = false;
        }
    }
</script>

<div class="space-y-4 p-4 border rounded-lg bg-background">
    <h3 class="text-lg font-medium">Upload Document</h3>

    <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="doc-type">Document Type</Label>
        <Select.Root type="single" bind:value={type as any}>
            <Select.Trigger class="w-[180px]">
                {selectedLabel}
            </Select.Trigger>
            <Select.Content>
                {#each types as t}
                    <Select.Item value={t.value}>{t.label}</Select.Item>
                {/each}
            </Select.Content>
        </Select.Root>
    </div>

    <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="doc-file">File</Label>
        <Input
            id="doc-file"
            type="file"
            onchange={(e) => {
                // @ts-ignore
                file = e.target.files?.[0] || null;
            }}
        />
    </div>

    <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="doc-branch">Branch/Version Label</Label>
        <Input id="doc-branch" bind:value={branch} placeholder="main" />
        <p class="text-xs text-muted-foreground">
            Use distinct branch names for different language versions (e.g.,
            'en', 'de').
        </p>
    </div>

    <Button
        disabled={!file || uploading}
        onclick={() => {
            if (!file) return;
            uploading = true;
            // @ts-ignore
            uploadDocument(entityType, entityId, file, type, branch)
                .then(() => {
                    onUploadComplete();
                    file = null;
                })
                .catch((e: any) => {
                    alert("Upload failed: " + e.message);
                })
                .finally(() => {
                    uploading = false;
                });
        }}
    >
        {#if uploading}
            Uploading...
        {:else}
            <Upload class="mr-2 h-4 w-4" /> Upload
        {/if}
    </Button>
</div>
