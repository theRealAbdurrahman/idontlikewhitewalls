import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Zap } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Enhanced toast configuration interface
 */
export interface ToastConfig {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number; // Duration in milliseconds, 0 for persistent
  position?: "bottom" | "top" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  dismissible?: boolean;
  icon?: React.ReactNode | boolean; // Custom icon or true for default variant icon
  className?: string;
  onDismiss?: () => void;
  onAutoClose?: () => void;
  pauseOnHover?: boolean;
  swipeDirection?: "horizontal" | "vertical" | "both";
}

/**
 * Toast variant styles using class-variance-authority
 */
const toastVariants = cva(
  [
    // Base styles - minimal and compact design
    "group pointer-events-auto relative flex w-full max-w-[80vw] items-center justify-between",
    "space-x-3 overflow-hidden rounded-xl border p-4 pr-3 shadow-lg backdrop-blur-sm",
    "transition-all duration-300 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    // Animation states
    "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full",
    // Swipe animations
    "data-[swipe=cancel]:translate-y-0 data-[swipe=cancel]:transition-transform",
    "data-[swipe=end]:animate-out data-[swipe=end]:fade-out-80 data-[swipe=end]:slide-out-to-bottom-full",
    "data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)]",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-gray-200 bg-white/95 text-gray-900",
          "focus:ring-gray-400"
        ],
        success: [
          "border-green-200 bg-green-50/95 text-green-900",
          "focus:ring-green-400"
        ],
        error: [
          "border-red-200 bg-red-50/95 text-red-900", 
          "focus:ring-red-400"
        ],
        warning: [
          "border-orange-200 bg-orange-50/95 text-orange-900",
          "focus:ring-orange-400"
        ],
        info: [
          "border-blue-200 bg-blue-50/95 text-blue-900",
          "focus:ring-blue-400"
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Get appropriate icon for toast variant
 */
const getVariantIcon = (variant: ToastConfig["variant"]) => {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-600" />;
    default:
      return <Zap className="h-5 w-5 text-gray-600" />;
  }
};

/**
 * Custom hook for managing toast auto-dismiss with pause on hover
 */
const useToastTimer = (
  duration: number,
  onAutoClose: () => void,
  pauseOnHover: boolean = true
) => {
  const [isPaused, setIsPaused] = React.useState(false);
  const [remainingTime, setRemainingTime] = React.useState(duration);
  const timerRef = React.useRef<NodeJS.Timeout>();
  const startTimeRef = React.useRef<number>();

  const startTimer = React.useCallback(() => {
    if (duration <= 0) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onAutoClose();
    }, remainingTime);
  }, [duration, remainingTime, onAutoClose]);

  const pauseTimer = React.useCallback(() => {
    if (timerRef.current && startTimeRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      setRemainingTime(prev => Math.max(0, prev - elapsed));
      setIsPaused(true);
    }
  }, []);

  const resumeTimer = React.useCallback(() => {
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  React.useEffect(() => {
    if (!isPaused && duration > 0) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused, startTimer, duration]);

  return {
    pauseTimer: pauseOnHover ? pauseTimer : () => {},
    resumeTimer: pauseOnHover ? resumeTimer : () => {},
    isPaused,
    remainingTime,
  };
};

/**
 * Enhanced Toast component with swipe gestures and improved accessibility
 */
const Toast = React.forwardRef<
  React.ElementRef<"div">,"div"> & ToastConfig
>(({
  className,
  variant = "default",
  duration = 3000,
  dismissible = true,
  icon = true,
  pauseOnHover = true,
  swipeDirection = "both",
  onDismiss,
  onAutoClose,
  title,
  description,
  action,
  ...props
}, ref) => {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [swipeOffset, setSwipeOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const toastRef = React.useRef<HTMLDivElement>(null);
  const startPosRef = React.useRef({ x: 0, y: 0 });

  /**
   * Handle auto-dismiss timer with pause functionality
   */
  const handleAutoClose = React.useCallback(() => {
    setIsDismissed(true);
    setTimeout(() => {
      onAutoClose?.();
      onDismiss?.();
    }, 300); // Wait for exit animation
  }, [onAutoClose, onDismiss]);

  const { pauseTimer, resumeTimer } = useToastTimer(
    duration,
    handleAutoClose,
    pauseOnHover
  );

  /**
   * Handle manual dismiss
   */
  const handleDismiss = React.useCallback(() => {
    if (!dismissible) return;
    setIsDismissed(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  }, [dismissible, onDismiss]);

  /**
   * Touch/mouse gesture handlers for swipe to dismiss
   */
  const handleStart = React.useCallback((clientX: number, clientY: number) => {
    if (!dismissible) return;
    setIsDragging(true);
    startPosRef.current = { x: clientX, y: clientY };
  }, [dismissible]);

  const handleMove = React.useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dismissible) return;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    // Apply swipe direction restrictions
    const allowedX = swipeDirection === "horizontal" || swipeDirection === "both";
    const allowedY = swipeDirection === "vertical" || swipeDirection === "both";

    setSwipeOffset({
      x: allowedX ? deltaX : 0,
      y: allowedY ? deltaY : 0,
    });
  }, [isDragging, dismissible, swipeDirection]);

  const handleEnd = React.useCallback(() => {
    if (!isDragging || !dismissible) return;

    const threshold = 50; // Minimum distance to trigger dismiss
    const { x, y } = swipeOffset;

    if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
      handleDismiss();
    } else {
      // Snap back to original position
      setSwipeOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
  }, [isDragging, dismissible, swipeOffset, handleDismiss]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && dismissible) {
      handleDismiss();
    }
  };

  // Get the appropriate icon
  const renderIcon = () => {
    if (icon === false) return null;
    if (React.isValidElement(icon)) return icon;
    if (icon === true) return getVariantIcon(variant);
    return null;
  };

  return (
    <div
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      data-state={isDismissed ? "closed" : "open"}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={isDragging ? handleMouseUp : undefined}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px)`,
        opacity: isDragging ? 0.8 : 1,
        transition: isDragging ? "none" : "all 0.2s ease-out",
      }}
      {...props}
    >
      {/* Icon */}
      {renderIcon() && (
        <div className="flex-shrink-0">
          {renderIcon()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-sm font-semibold leading-tight">
            {title}
          </div>
        )}
        {description && (
          <div className={cn(
            "text-sm leading-relaxed",
            title ? "mt-1 opacity-90" : ""
          )}>
            {description}
          </div>
        )}
      </div>

      {/* Action */}
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            "flex-shrink-0 rounded-full p-1.5 transition-colors",
            "hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2",
            variant === "error" && "hover:bg-red-200 focus:ring-red-400",
            variant === "success" && "hover:bg-green-200 focus:ring-green-400",
            variant === "warning" && "hover:bg-orange-200 focus:ring-orange-400",
            variant === "info" && "hover:bg-blue-200 focus:ring-blue-400"
          )}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Progress indicator for auto-dismiss */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-xl overflow-hidden">
          <div
            className={cn(
              "h-full transition-all ease-linear",
              variant === "success" && "bg-green-500",
              variant === "error" && "bg-red-500",
              variant === "warning" && "bg-orange-500",
              variant === "info" && "bg-blue-500",
              variant === "default" && "bg-gray-500"
            )}
            style={{
              animation: `toast-progress ${duration}ms linear`,
              animationPlayState: pauseOnHover ? "running" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
});

Toast.displayName = "Toast";

/**
 * Toast action component for additional interactions
 */
const ToastAction = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button"> & {
    altText: string;
  }
>(({ className, altText, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-xs font-medium transition-colors",
      "hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));

ToastAction.displayName = "ToastAction";

/**
 * Toast close component for custom close buttons
 */
const ToastClose = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));

ToastClose.displayName = "ToastClose";

/**
 * Toast title component
 */
const ToastTitle = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props}
  />
));

ToastTitle.displayName = "ToastTitle";

/**
 * Toast description component
 */
const ToastDescription = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
));

ToastDescription.displayName = "ToastDescription";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  type ToastConfig,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
};