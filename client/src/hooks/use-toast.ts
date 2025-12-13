import { useState, useCallback } from "react";

export interface Toast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCallback: ((toast: Toast) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([]);

  const toast = useCallback((props: Toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...props, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Register global toast callback
  if (!toastCallback) {
    toastCallback = toast;
  }

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}

// Global toast function for use outside components
export function showToast(props: Toast) {
  if (toastCallback) {
    toastCallback(props);
  } else {
    console.warn("Toast system not initialized");
  }
}
