<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Card from "$lib/components/ui/card";

    // This page would be protected by auth middleware to ensure the user has 'onboarding' status
    // or is the user associated with the magic link.

    // For now, simple form layout.
</script>

<div class="flex items-center justify-center min-h-screen bg-muted/40 p-4">
    <Card.Root class="w-full max-w-lg">
        <Card.Header>
            <Card.Title class="text-2xl">Complete Your Profile</Card.Title>
            <Card.Description
                >Welcome to the team! Please provide your details to complete
                onboarding.</Card.Description
            >
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="grid gap-2">
                <Label for="address">Address</Label>
                <Input id="address" placeholder="123 Main St" />
            </div>
            <div class="grid gap-2">
                <Label for="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div class="grid gap-2">
                <Label for="emergency">Emergency Contact</Label>
                <Input id="emergency" placeholder="Name & Phone" />
            </div>
        </Card.Content>
        <Card.Footer class="flex justify-end">
            <Button>Submit Profile</Button>
        </Card.Footer>
    </Card.Root>
</div>
