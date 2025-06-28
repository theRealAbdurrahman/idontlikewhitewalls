import * as React from "react";
import { Toast, type ToastConfig } from "./toast";
import { cn } from "../../lib/utils";

/**
 * Maximum number of toasts to show simultaneously
 */
const MAX_TOASTS = 5;

/**
 * Position variants for the toaster container
 */
const positionVariants = {
  "bottom": "bottom-5 left-1/2 -translate-x-1/2",
  "top": "top-5 left-1/2 -translate-x-1/2",
  "top-left": "top-5 left-5",
  "top-right": "top-5 right-5",
  "bottom-left": "bottom-5 left-5",
  "bottom-right": "bottom-5 right-5",
};

/**
 * Enhanced Toaster container component with queue management
 */
export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastConfig[]>([]);

  /**
   * Add a new toast to the queue
   */
  const addToast = React.useCallback((toast: ToastConfig) => {
    setToasts(prevToasts => {
      // Remove any existing toast with the same ID
      const filteredToasts = prevToasts.filter(t => t.id !== toast.id);
      
      // Add new toast and limit to MAX_TOASTS
      const newToasts = [toast, ...filteredToasts].slice(0, MAX_TOASTS);
      
      return newToasts;
    });
  }, []);

  /**
   * Remove a toast from the queue
   */
  const removeToast = React.useCallback((toastId: string) => {
    setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Listen for toast events from the useToast hook
   */
  React.useEffect(() => {
    const handleToastEvent = (event: CustomEvent<ToastConfig>) => {
      addToast(event.detail);
    };

    const handleToastRemove = (event: CustomEvent<{ id: string }>) => {
      removeToast(event.detail.id);
    };

    const handleToastClear = () => {
      clearToasts();
    };

    // Listen for custom events
    window.addEventListener('toast-add' as any, handleToastEvent);
    window.addEventListener('toast-remove' as any, handleToastRemove);
    window.addEventListener('toast-clear' as any, handleToastClear);

    return () => {
      window.removeEventListener('toast-add' as any, handleToastEvent);
      window.removeEventListener('toast-remove' as any, handleToastRemove);
      window.removeEventListener('toast-clear' as any, handleToastClear);
    };
  }, [addToast, removeToast, clearToasts]);

  /**
   * Group toasts by position for proper rendering
   */
  const toastsByPosition = React.useMemo(() => {
    const groups: Record<string, ToastConfig[]> = {};
    
    toasts.forEach(toast => {
      const position = toast.position || "bottom";
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(toast);
    });
    
    return groups;
  }, [toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Progress Animations */}
      <style>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .toast-stack {
          z-index: 9999;
        }
        
        .toast-stack > * + * {
          margin-top: 8px;
        }
        
        /* Stacking effect for multiple toasts */
        .toast-stack > *:nth-child(n+2) {
          transform: translateY(-4px) scale(0.98);
          opacity: 0.95;
        }
        
        .toast-stack > *:nth-child(n+3) {
          transform: translateY(-8px) scale(0.96);
          opacity: 0.9;
        }
        
        .toast-stack > *:nth-child(n+4) {
          transform: translateY(-12px) scale(0.94);
          opacity: 0.85;
        }
        
        .toast-stack > *:nth-child(n+5) {
          transform: translateY(-16px) scale(0.92);
          opacity: 0.8;
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .toast-container {
            left: 1rem !important;
            right: 1rem !important;
            transform: none !important;
            max-width: calc(100vw - 2rem);
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .toast-container > * {
            border-width: 2px;
            background-color: white !important;
            color: black !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .toast-container > * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
          
          @keyframes toast-progress {
            from, to {
              width: 0%;
            }
          }
        }
      `}</style>

      {/* Render toast containers for each position */}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={cn(
            "toast-container fixed z-[9999] flex flex-col-reverse items-center justify-end pointer-events-none",
            "toast-stack",
            positionVariants[position as keyof typeof positionVariants] || positionVariants.bottom
          )}
          role="region"
          aria-label="Notifications"
          aria-live="polite"
        >
          {positionToasts.map((toast, index) => (
            <Toast
              key={toast.id}
              {...toast}
              onDismiss={() => removeToast(toast.id)}
              onAutoClose={() => removeToast(toast.id)}
              className={cn(
                "pointer-events-auto",
                // Add stacking styles
                index > 0 && "transform transition-transform duration-200 ease-out",
                toast.className
              )}
              style={{
                // Apply stacking transform
                ...(index > 0 && {
                  transform: `translateY(-${index * 4}px) scale(${1 - index * 0.02})`,
                  opacity: Math.max(0.8, 1 - index * 0.05),
                  zIndex: 9999 - index,
                }),
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
}