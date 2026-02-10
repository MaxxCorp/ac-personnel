<script lang="ts">
    import { getEmployees } from "../../api/employees.remote";
    import { onMount } from "svelte";
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import * as Sheet from "$lib/components/ui/sheet";
    import DocumentManager from "$lib/components/documents/DocumentManager.svelte";
    import { Eye } from "@lucide/svelte";

    // Remote function type
    // @ts-ignore
    type Employee = Awaited<ReturnType<typeof getEmployees>>[number];

    let employees: Employee[] = $state([]);
    let loading = $state(true);
    let selectedEmployee: Employee | null = $state(null);
    let sheetOpen = $state(false);

    function openEmployee(emp: Employee) {
        selectedEmployee = emp;
        sheetOpen = true;
    }

    onMount(async () => {
        try {
            // @ts-ignore
            employees = await getEmployees();
        } catch (e) {
            console.error("Failed to load employees", e);
        } finally {
            loading = false;
        }
    });
</script>

<div class="p-8">
    <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold tracking-tight">Employees</h2>
        <Button>Add Employee</Button>
    </div>

    {#if loading}
        <div class="p-4">Loading employees...</div>
    {:else}
        <div class="rounded-md border">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Name</Table.Head>
                        <Table.Head>Email</Table.Head>
                        <Table.Head>Role</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head>Department</Table.Head>
                        <Table.Head>Joined</Table.Head>
                        <Table.Head>Actions</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each employees as employee (employee.id)}
                        <Table.Row>
                            <Table.Cell class="font-medium"
                                >{employee.firstName}
                                {employee.lastName}</Table.Cell
                            >
                            <Table.Cell
                                >{employee.workEmail ||
                                    employee.personalEmail}</Table.Cell
                            >
                            <Table.Cell>{employee.role}</Table.Cell>
                            <Table.Cell>{employee.status}</Table.Cell>
                            <Table.Cell>{employee.department || "-"}</Table.Cell
                            >
                            <Table.Cell
                                >{new Date(
                                    employee.createdAt,
                                ).toLocaleDateString()}</Table.Cell
                            >
                            <Table.Cell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() => openEmployee(employee)}
                                >
                                    <Eye class="h-4 w-4" />
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                    {#if employees.length === 0}
                        <Table.Row>
                            <Table.Cell colspan={7} class="h-24 text-center"
                                >No employees found.</Table.Cell
                            >
                        </Table.Row>
                    {/if}
                </Table.Body>
            </Table.Root>
        </div>
    {/if}

    <Sheet.Root bind:open={sheetOpen}>
        <Sheet.Content class="w-[600px] sm:max-w-xl overflow-y-auto">
            <Sheet.Header>
                <Sheet.Title>Employee Details</Sheet.Title>
                <Sheet.Description>
                    Manage documents and details for {selectedEmployee?.firstName}
                    {selectedEmployee?.lastName}
                </Sheet.Description>
            </Sheet.Header>

            {#if selectedEmployee}
                <div class="py-6">
                    <DocumentManager
                        entityType="employee"
                        entityId={selectedEmployee.id}
                    />
                </div>
            {/if}
        </Sheet.Content>
    </Sheet.Root>
</div>
