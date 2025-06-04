"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Simplified AlertDialog components without Radix UI dependency
interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  children,
  open,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = React.useState(open || false);

  React.useEffect(() => {
    if (open !== undefined && open !== isOpen) {
      setIsOpen(open);
      onOpenChange?.(open);
    }
  }, [open, isOpen, onOpenChange]);

  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen: (newOpen: boolean) => {
              setIsOpen(newOpen);
              onOpenChange?.(newOpen);
            }
          });
        }
        return child;
      })}
    </div>
  );
};

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({
  children,
  asChild,
  isOpen,
  setIsOpen
}) => {
  return (
    <div onClick={() => setIsOpen?.(true)}>
      {children}
    </div>
  );
};

const AlertDialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const AlertDialogOverlay: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/80",
        className
      )}
      {...props}
    />
  );
};

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({
  className,
  children,
  isOpen,
  setIsOpen,
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setIsOpen?.(false)}
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg",
          className
        )}
        onClick={e => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};

const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4",
        className
      )}
      {...props}
    />
  );
};

const AlertDialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => {
  return (
    <h2
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
};

const AlertDialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => {
  return (
    <p
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
};

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({
  className,
  onClick,
  isOpen,
  setIsOpen,
  ...props
}) => {
  return (
    <Button
      className={className}
      onClick={(e) => {
        onClick?.(e as any);
        setIsOpen?.(false);
      }}
      {...props}
    />
  );
};

const AlertDialogCancel: React.FC<AlertDialogActionProps> = ({
  className,
  onClick,
  isOpen,
  setIsOpen,
  ...props
}) => {
  return (
    <Button
      variant="outline"
      className={cn("mt-2 sm:mt-0", className)}
      onClick={(e) => {
        onClick?.(e as any);
        setIsOpen?.(false);
      }}
      {...props}
    />
  );
};

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
