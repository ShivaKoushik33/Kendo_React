import api from "./Api";
import type { Employee, EmployeeInput } from "../types/employee";

export interface DashboardSummary {
    totalEmployees: number;
    activeEmployees: number;
    averageAttendance: number;
    averagePerformance: number;
}

export const getDashboardSummary = async (filters: {
    departmentId?: number;
    employmentTypeId?: number;
    locationId?: number;
}): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>("/dashboard/summary", {
        params: filters
    });

    return response.data;
};

export interface PaginatedEmployees {
    data: Employee[];
    total: number;
}

export const getEmployees = async (): Promise<Employee[]> =>
    {
        const response=await api.get<Employee[]>("/employees");
    return response.data;
};

export const getEmployeesPaginated = async (page: number, size: number): Promise<PaginatedEmployees> => {
    const response = await api.get<PaginatedEmployees>("/employees/paginated", {
        params: { offset: page, size }
    });

    return response.data;
};

export const getEmployeeById=async(id:number):Promise<Employee>=>
    {
    const response=await api.get<Employee>(`/employees/${id}`);
    return response.data;
};

export const addEmployee = async (employee: EmployeeInput) => {
    const response = await api.post("/employees", employee);
    return response.data;
};

export const updateEmployee = async (id: number, employee: EmployeeInput) => {
    const response = await api.put(`/employees/${id}`,employee);
    return response.data;
};

export const deleteEmployee = async (id: number) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
};
