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

export interface EmployeeFilters {
    departmentId?: number;
    employmentTypeId?: number;
    locationId?: number;
}

export interface EmployeeSort {
    field: string;
    dir: "asc" | "desc";
}

export interface DepartmentAttendance {
    department: string;
    attendance: number;
}

export interface AttendanceSummary {
    averageAttendance: number;
    highestAttendance: number;
    excellentCount: number;
    lowCount: number;
    byDepartment: DepartmentAttendance[];
}

export interface DepartmentProjectLoad {
    department: string;
    projects: number;
}

export interface ProjectsSummary {
    totalProjects: number;
    averageProjects: number;
    activeEmployees: number;
    highestProjects: number;
    byDepartment: DepartmentProjectLoad[];
}

export const getEmployees = async (): Promise<Employee[]> =>
    {
        const response=await api.get<Employee[]>("/employees");
    return response.data;
};

export const getEmployeesPaginated = async (offset: number, size: number, filters?: EmployeeFilters, sort?: EmployeeSort): Promise<PaginatedEmployees> => {
    const response = await api.get<PaginatedEmployees>("/employees/paginated", {
        params: { offset, size, ...filters, sortField: sort?.field, sortDirection: sort?.dir }
    });

    return response.data;
};

export const downloadEmployeesExcelFromBackend = async (filters?: EmployeeFilters, sort?: EmployeeSort): Promise<Blob> => {
    const response = await api.get<Blob>("/employees/export/excel", {
        params: { ...filters, sortField: sort?.field, sortDirection: sort?.dir },
        responseType: "blob"
    });
    return response.data;
};

export const downloadPaginatedEmployeesExcelFromBackend = async (offset: number, size: number, sort?: EmployeeSort): Promise<Blob> => {
    const response = await api.get<Blob>("/employees/export/excel/page", {
        params: { offset, size, sortField: sort?.field, sortDirection: sort?.dir },
        responseType: "blob"
    });
    return response.data;
};

export const getTopContributors = async (offset: number, size: number, filters?: EmployeeFilters): Promise<PaginatedEmployees> => {
    const response = await api.get<PaginatedEmployees>("/employees/top-contributors", {
        params: { offset, size, ...filters }
    });

    return response.data;
};

export const getAttendanceSummary = async (filters: EmployeeFilters): Promise<AttendanceSummary> => {
    const response = await api.get<AttendanceSummary>("/dashboard/attendance-summary", {
        params: filters
    });

    return response.data;
};

export const getProjectsSummary = async (filters: EmployeeFilters): Promise<ProjectsSummary> => {
    const response = await api.get<ProjectsSummary>("/dashboard/projects-summary", {
        params: filters
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
