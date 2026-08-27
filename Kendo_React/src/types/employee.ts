export interface Employee {
    id: number;
    employeeCode: string;
    name: string;
    department: string;
    employmentType: string;
    location: string;
    attendance: number;
    performance: number;
    activeProjects: number;
    experienceYears: number;
    salary: number;
    joiningYear: number;
    isActive: boolean;
    departmentId: number;
    employmentTypeId: number;
    locationId: number;
}

export type EmployeeInput = Omit<Employee, "id">;
