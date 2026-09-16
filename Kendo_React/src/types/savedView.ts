export interface SavedView {
    id: string;
    name: string;
    departmentId: number;
    employmentTypeId: number;
    locationId: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SavedViewInput {
    name: string;
    departmentId: number;
    employmentTypeId: number;
    locationId: number;
    isDefault: boolean;
}
