import { object, string, email, picklist, pipe, type InferOutput } from 'valibot';

export const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'talentManagement', label: 'Talent Management' },
    { value: 'hiringManager', label: 'Hiring Manager' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
    { value: 'applicant', label: 'Applicant' },
] as const;

export const createEmployeeSchema = object({
    firstName: string('First name is required'),
    lastName: string('Last name is required'),
    personalEmail: pipe(string(), email('Invalid email address')),
    role: picklist(
        roleOptions.map((option) => option.value),
        'Invalid role'
    ),
    department: string('Department is required')
});

export type CreateEmployeeInput = InferOutput<typeof createEmployeeSchema>;
