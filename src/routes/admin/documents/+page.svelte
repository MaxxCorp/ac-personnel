<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import { FileText } from "@lucide/svelte";
</script>

<div class="container py-10">
    <div class="flex items-center space-x-2 mb-6">
        <FileText class="h-8 w-8" />
        <h1 class="text-3xl font-bold">Documents</h1>
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>Document Management</Card.Title>
            <Card.Description
                >Manage company-wide documents and templates.</Card.Description
            >
        </Card.Header>
        <Card.Content>
            <p class="text-muted-foreground">
                Document management features coming soon.
            </p>
        </Card.Content>
    </Card.Root>
</div>
