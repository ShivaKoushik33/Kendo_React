import api from "./Api";
import type { SavedView, SavedViewInput } from "../types/savedView";

export const getSavedViews = async (): Promise<SavedView[]> => {
    const response = await api.get<SavedView[]>("/savedviews");
    return response.data;
};

export const getDefaultSavedView = async (): Promise<SavedView | null> => {
    const response = await api.get<SavedView>("/savedviews/default");

    // The API answers 204 when the user has not set a default. Axios gives an
    // empty string as the body for that, not null - so check the status.
    return response.status === 204 ? null : response.data;
};

export const createSavedView = async (input: SavedViewInput): Promise<SavedView> => {
    const response = await api.post<SavedView>("/savedviews", input);
    return response.data;
};

export const updateSavedView = async (id: string, input: SavedViewInput): Promise<void> => {
    await api.put(`/savedviews/${id}`, input);
};

export const setDefaultSavedView = async (id: string): Promise<void> => {
    await api.put(`/savedviews/${id}/default`);
};

export const deleteSavedView = async (id: string): Promise<void> => {
    await api.delete(`/savedviews/${id}`);
};
