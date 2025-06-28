import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Base toast configuration interface
 */
interface ToastConfig {
  open?: boolean;
  className?: string;
}

/**
 * Enhanced toast configuration for the useToast hook
 */
type ToasterToast = ToastConfig & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  position?: "bottom" | "top" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  dismissible?: boolean;
  icon?: React.ReactNode | boolean;
  onDismiss?: () => void;
  onAutoClose?: () => void;
  pauseOnHover?: boolean;
  swipeDirection?: "horizontal" | "vertical" | "both";
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  CLEAR_TOASTS: "CLEAR_TOASTS",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["CLEAR_TOASTS"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
      
    case "CLEAR_TOASTS":
      return {
        ...state,
        toasts: [],
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
  
  // Emit custom events for the Toaster component
  if (action.type === "ADD_TOAST") {
    window.dispatchEvent(new CustomEvent("toast-add", { detail: action.toast }));
  } else if (action.type === "REMOVE_TOAST" && action.toastId) {
    window.dispatchEvent(new CustomEvent("toast-remove", { detail: { id: action.toastId } }));
  } else if (action.type === "CLEAR_TOASTS") {
    window.dispatchEvent(new CustomEvent("toast-clear"));
  }
}

/**
 * Enhanced toast options with comprehensive configuration
 */
type Toast = Omit<ToasterToast, "id"> & {
  // Backward compatibility
  variant?: "default" | "destructive" | "success" | "error" | "warning" | "info";
};

/**
 * Main toast function with enhanced configuration options
 */
function toast(options: Toast | string) {
  let toastConfig: Toast;
  
  // Handle legacy string input
  if (typeof options === "string") {
    toastConfig = {
      description: options,
      variant: "default",
    };
  } else {
    toastConfig = { ...options };
  }
  
  // Handle legacy "destructive" variant
  if (toastConfig.variant === "destructive") {
    toastConfig.variant = "error";
  }
  
  // Apply default configuration
  const id = genId();
  const finalConfig: ToasterToast = {
    id,
    duration: 3000,
    position: "bottom",
    dismissible: true,
    pauseOnHover: true,
    swipeDirection: "both",
    icon: true,
    ...toastConfig,
  };

  const update = (newConfig: Partial<ToasterToast>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...newConfig, id },
    });
    
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: finalConfig,
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * Utility functions for common toast types
 */
toast.success = (options: Omit<Toast, "variant"> | string) => {
  const config = typeof options === "string" ? { description: options } : options;
  return toast({ ...config, variant: "success" });
};

toast.error = (options: Omit<Toast, "variant"> | string) => {
  const config = typeof options === "string" ? { description: options } : options;
  return toast({ ...config, variant: "error" });
};

toast.warning = (options: Omit<Toast, "variant"> | string) => {
  const config = typeof options === "string" ? { description: options } : options;
  return toast({ ...config, variant: "warning" });
};

toast.info = (options: Omit<Toast, "variant"> | string) => {
  const config = typeof options === "string" ? { description: options } : options;
  return toast({ ...config, variant: "info" });
};

/**
 * Promise-based toast for async operations
 */
toast.promise = <T,>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
    ...options
  }: {
    loading?: React.ReactNode;
    success?: React.ReactNode | ((data: T) => React.ReactNode);
    error?: React.ReactNode | ((error: any) => React.ReactNode);
  } & Omit<Toast, "variant" | "description">
) => {
  const id = genId();
  
  // Show loading toast
  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      description: loading || "Loading...",
      variant: "default",
      duration: 0, // Don't auto-dismiss
      dismissible: false,
      ...options,
    },
  });

  promise
    .then((data) => {
      const successMessage = typeof success === "function" ? success(data) : success;
      dispatch({
        type: "UPDATE_TOAST",
        toast: {
          id,
          description: successMessage || "Success!",
          variant: "success",
          duration: 3000,
          dismissible: true,
        },
      });
    })
    .catch((error) => {
      const errorMessage = typeof error === "function" ? error(error) : error;
      dispatch({
        type: "UPDATE_TOAST",
        toast: {
          id,
          description: errorMessage || "Something went wrong",
          variant: "error",
          duration: 5000,
          dismissible: true,
        },
      });
    });

  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
};

/**
 * Clear all toasts
 */
toast.clear = () => {
  dispatch({ type: "CLEAR_TOASTS" });
};

/**
 * Enhanced useToast hook with comprehensive functionality
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    clear: () => dispatch({ type: "CLEAR_TOASTS" }),
  };
}

export { useToast, toast };
export type { ToasterToast, ToastConfig };