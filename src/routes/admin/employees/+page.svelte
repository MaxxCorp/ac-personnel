<script lang="ts">
    import {
        getAllEmployees,
        createEmployee,
        deleteEmployee,
    } from "../../api/employees.remote";
    import { createEmployeeSchema, roleOptions } from "$lib/schemas";
    import { onMount } from "svelte";
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import AsyncButton from "$lib/components/ui/button/AsyncButton.svelte";
    import * as Sheet from "$lib/components/ui/sheet";
    import DocumentManager from "$lib/components/documents/DocumentManager.svelte";
    import { Eye, Plus, Trash2 } from "@lucide/svelte";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { toast } from "svelte-sonner";

    // Remote function type
    // @ts-ignore
    type Employee = Awaited<ReturnType<typeof getAllEmployees>>[number];

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
            employees = await getAllEmployees();
        } catch (e) {
            console.error("Failed to load employees", e);
        } finally {
            loading = false;
        }
    });

    let addSheetOpen = $state(false);
</script>

<div class="p-8">
    <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold tracking-tight">Employees</h2>
        <Button onclick={() => (addSheetOpen = true)}>
            <Plus class="mr-2 h-4 w-4" /> Add Employee
        </Button>
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={async () => {
                                        if (
                                            confirm(
                                                `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`,
                                            )
                                        ) {
                                            try {
                                                // @ts-ignore
                                                await deleteEmployee(
                                                    employee.id,
                                                );
                                                toast.success(
                                                    "Employee deleted successfully",
                                                );
                                            } catch (e) {
                                                toast.error(
                                                    "Failed to delete employee",
                                                );
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 class="h-4 w-4 text-destructive" />
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

    <!-- Detail Sheet -->
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

    <!-- Add Employee Sheet -->
    <Sheet.Root bind:open={addSheetOpen}>
        <Sheet.Content class="w-full sm:max-w-md p-6">
            <Sheet.Header>
                <Sheet.Title>Add New Employee</Sheet.Title>
                <Sheet.Description>
                    Create a new employee record.
                </Sheet.Description>
            </Sheet.Header>
            <div class="grid gap-4 py-4">
                <!-- @ts-ignore -->
                <form
                    {...createEmployee
                        .preflight(createEmployeeSchema)
                        .enhance(async ({ form, submit }) => {
                            try {
                                // Use updates() to invalidate/refresh the getAllEmployees query
                                // The result of updates() is the response from the server (often undefined or void if query refresh)
                                // But createEmployee remote function returns the created employee or throws.

                                // submit() resolves if the request completes, but might contain an error within the result wrapper if using remote functions?
                                // Standard remote function usage:
                                // await submit();
                                // If failed, createEmployee.error would be set.

                                await submit();

                                toast.success("Employee created successfully");
                                (addSheetOpen = false), form.reset();
                            } catch (e: any) {
                                console.error("Form submission error:", e);
                                toast.error(
                                    e.message || "Failed to create employee",
                                );
                            }
                        })}
                >
                    <div class="grid gap-4">
                        <div class="grid w-full items-center gap-1.5">
                            <Label>First Name</Label>
                            <Input
                                placeholder="First Name"
                                {...createEmployee.fields.firstName.as("text")}
                            />
                        </div>
                        <div class="grid w-full items-center gap-1.5">
                            <Label>Last Name</Label>
                            <Input
                                placeholder="Last Name"
                                {...createEmployee.fields.lastName.as("text")}
                            />
                        </div>
                        <div class="grid w-full items-center gap-1.5">
                            <Label>Personal Email</Label>
                            <Input
                                placeholder="Email"
                                {...createEmployee.fields.personalEmail.as(
                                    "email",
                                )}
                            />
                        </div>
                        <div class="grid w-full items-center gap-1.5">
                            <Label for="role">Role</Label>
                            <select
                                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...createEmployee.fields.role.as("select")}
                            >
                                {#each roleOptions as role}
                                    <option
                                        value={role.value}
                                        selected={role.value === "employee" ||
                                            undefined}>{role.label}</option
                                    >
                                {/each}
                            </select>
                        </div>
                        <div class="grid w-full items-center gap-1.5">
                            <Label for="department">Department</Label>
                            <Input
                                placeholder="Department"
                                {...createEmployee.fields.department.as("text")}
                            />
                        </div>

                        <AsyncButton
                            loading={createEmployee.pending}
                            type="submit"
                            class="mt-4"
                            loadingLabel="Creating..."
                        >
                            Create Employee
                        </AsyncButton>
                    </div>
                </form>
            </div>
            <Sheet.Footer>
                <!-- Footer content if any -->
            </Sheet.Footer>
        </Sheet.Content>
    </Sheet.Root>
</div>
