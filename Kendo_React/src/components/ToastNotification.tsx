import { Notification, NotificationGroup } from "@progress/kendo-react-notification";
import { Fade } from "@progress/kendo-react-animation";
import type { ToastMessage } from "../hooks/useToast";

interface ToastNotificationProps {
    toasts: ToastMessage[];
    onClose: (id: number) => void;
}

const ToastNotification = ({ toasts, onClose }: ToastNotificationProps) => {
    return (
        <NotificationGroup
            style={{
                position: "fixed",
                right: 20,
                top: 20,
                zIndex: 10000,
            }}
        >
            {toasts.map((toast) => (
                <Fade key={toast.id}>
                    <Notification
                        type={{ style: toast.type, icon: true }}
                        closable
                        onClose={() => onClose(toast.id)}
                    >
                        <span>{toast.text}</span>
                    </Notification>
                </Fade>
            ))}
        </NotificationGroup>
    );
};

export default ToastNotification;
