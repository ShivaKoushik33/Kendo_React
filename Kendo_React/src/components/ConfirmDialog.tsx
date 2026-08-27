import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Button } from "@progress/kendo-react-buttons";

interface ConfirmDialogProps {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog = ({
    title = "Confirm",
    message,
    confirmText = "Yes",
    cancelText = "No",
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    return (
        <Dialog title={title} onClose={onCancel} width={380}>
            <p style={{ margin: 0 }}>{message}</p>
            <DialogActionsBar>
                <Button type="button" onClick={onCancel} disabled={busy}>
                    {cancelText}
                </Button>
                <Button type="button" themeColor="error" onClick={onConfirm} disabled={busy}>
                    {busy ? "Deleting..." : confirmText}
                </Button>
            </DialogActionsBar>
        </Dialog>
    );
};

export default ConfirmDialog;
