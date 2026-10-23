import api from "./Api";

export interface SnapshotEmailInput {
    imageBase64: string;
    subject?: string;
    note?: string;
    fileName?: string;
}

// The API answers with a plain string on both success and failure, matching
// the other controllers in this project.
export const sendSnapshotEmail = async (input: SnapshotEmailInput): Promise<string> => {
    const response = await api.post<string>("/email/snapshot", input);
    return response.data;
};

export const sendTestEmail = async (): Promise<string> => {
    const response = await api.post<string>("/email/test");
    return response.data;
};
