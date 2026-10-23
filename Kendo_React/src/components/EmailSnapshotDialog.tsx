import { useState } from "react";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Button } from "@progress/kendo-react-buttons";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { Loader } from "@progress/kendo-react-indicators";

interface EmailSnapshotDialogProps {
    previewImage: string;
    defaultSubject: string;
    busy: boolean;
    onSend: (subject: string, note: string) => void;
    onCancel: () => void;
}

const EmailSnapshotDialog = ({
    previewImage,
    defaultSubject,
    busy,
    onSend,
    onCancel,
}: EmailSnapshotDialogProps) => {
    const [subject, setSubject] = useState(defaultSubject);
    const [note, setNote] = useState("");

    return (
        <Dialog title="Email dashboard snapshot" onClose={busy ? undefined : onCancel} width={640}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>Subject</p>
                    <Input
                        value={subject}
                        onChange={(event) => setSubject(String(event.value ?? ""))}
                        disabled={busy}
                        style={{ width: "100%" }}
                    />
                </div>

                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>Note (optional)</p>
                    <TextArea
                        value={note}
                        onChange={(event) => setNote(String(event.value ?? ""))}
                        disabled={busy}
                        rows={3}
                        placeholder="Added above the image in the email body..."
                        style={{ width: "100%" }}
                    />
                </div>

                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500 }}>
                        Preview - this is exactly what gets sent
                    </p>
                    <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #e0e0e0", borderRadius: 4 }}>
                        <img src={previewImage} alt="Dashboard snapshot preview" style={{ display: "block", width: "100%" }} />
                    </div>
                </div>

                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                    Sent to the recipient configured on the server.
                </p>
            </div>

            <DialogActionsBar>
                <Button type="button" onClick={onCancel} disabled={busy}>
                    Cancel
                </Button>
                <Button
                    type="button"
                    themeColor="primary"
                    onClick={() => onSend(subject.trim(), note.trim())}
                    disabled={busy || subject.trim().length === 0}
                >
                    {busy && <Loader size="small" type="infinite-spinner" />}
                    {busy ? " Sending..." : "Send Email"}
                </Button>
            </DialogActionsBar>
        </Dialog>
    );
};

export default EmailSnapshotDialog;
