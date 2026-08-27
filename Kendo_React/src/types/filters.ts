export interface FilterOption {
    id: number;
    name: string;
}

export interface DashboardFilters {
    departments: FilterOption[];
    locations: FilterOption[];
    employmentTypes: FilterOption[];
    skills: FilterOption[];
}
