import api from "./Api";
import type { DashboardFilters } from "../types/filters";

export const getFilters = async (): Promise<DashboardFilters> => {
    const response = await api.get<DashboardFilters>("/filters");
    return response.data;
};
