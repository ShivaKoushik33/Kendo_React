import { useCallback, useRef, useState } from "react";
export type ToastType = "success" | "error" | "warning" | "info";
export interface ToastMessage {
    id: number;
    text: string;
    type: ToastType;
}
const AUTO_DISMISS_MS = 3500;
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const nextId = useRef(0);
    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);
    const showToast = useCallback((text: string, type: ToastType) => {
        const id = ++nextId.current;
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    }, [removeToast]);
    return { toasts, showToast, removeToast };
}
    