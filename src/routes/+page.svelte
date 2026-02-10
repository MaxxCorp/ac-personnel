<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";
    import { Calendar, Clock, Users, ArrowRight } from "@lucide/svelte";

    let email = $state("");
    let isLoading = $state(false);

    async function handleSignIn() {
        if (!email) {
            toast.error("Please enter your email address.");
            return;
        }
        isLoading = true;
        await authClient.signIn.magicLink(
            {
                email,
                callbackURL: "/dashboard",
            },
            {
                onSuccess: () => {
                    toast.success("Magic link sent! Check your inbox.");
                    isLoading = false;
                    email = "";
                },
                onError: (ctx: any) => {
                    toast.error(ctx.error.message);
                    isLoading = false;
                },
            },
        );
    }
</script>

<div class="container mx-auto px-4 py-16 space-y-24">
    <!-- Hero Section -->
    <section class="text-center space-y-6 max-w-3xl mx-auto">
        <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Simplify Your Workflow with <span class="text-primary"
                >AC Personnel</span
            >
        </h1>
        <p class="text-xl text-muted-foreground">
            The all-in-one solution for employee management, time tracking, and
            recruiting. Streamline your operations and focus on what matters
            most - your people.
        </p>

        <div
            class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto pt-4"
        >
            <div class="grid w-full gap-2">
                <Label for="hero-email" class="sr-only">Email</Label>
                <Input
                    id="hero-email"
                    type="email"
                    placeholder="Enter your email to start"
                    bind:value={email}
                />
            </div>
            <Button
                size="lg"
                onclick={handleSignIn}
                disabled={isLoading}
                class="w-full sm:w-auto"
            >
                {#if isLoading}
                    Sending...
                {:else}
                    Get Started <ArrowRight class="ml-2 h-4 w-4" />
                {/if}
            </Button>
        </div>
        <p class="text-xs text-muted-foreground">
            No password required. We'll send a magic link to your email.
        </p>
    </section>

    <!-- Features Section -->
    <section class="grid md:grid-cols-3 gap-8">
        <Card.Root>
            <Card.Header>
                <Clock class="h-10 w-10 text-primary mb-2" />
                <Card.Title>Time Tracking</Card.Title>
                <Card.Description
                    >Effortless time logging for your team.</Card.Description
                >
            </Card.Header>
            <Card.Content>
                <p>
                    Track work hours, breaks, and overtime with ease. Generate
                    reports and keep payroll accurate without the headache.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Calendar class="h-10 w-10 text-primary mb-2" />
                <Card.Title>Absence Management</Card.Title>
                <Card.Description
                    >Streamlined leave requests and approvals.</Card.Description
                >
            </Card.Header>
            <Card.Content>
                <p>
                    Employees can request time off in seconds. Managers get
                    notified instantly and can approve or deny requests with a
                    single click.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Users class="h-10 w-10 text-primary mb-2" />
                <Card.Title>Recruiting & HR</Card.Title>
                <Card.Description>Find and manage top talent.</Card.Description>
            </Card.Header>
            <Card.Content>
                <p>
                    Manage job postings, applicants, and onboarding workflows.
                    Keep all your personnel data organized in one secure place.
                </p>
            </Card.Content>
        </Card.Root>
    </section>

    <Separator />

    <!-- Footer / CTA -->
    <section class="text-center space-y-4">
        <h2 class="text-2xl font-bold">Ready to modernize your HR?</h2>
        <p class="text-muted-foreground">
            Join thousands of companies using AC Personnel.
        </p>
    </section>
</div>
