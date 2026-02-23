import type { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "error" | "info" | "success";
  "aria-live"?: "polite" | "assertive";
  role?: "alert" | "status";
  id?: string;
}

export function Alert({
  children,
  variant = "error",
  "aria-live": ariaLive = "assertive",
  role = "alert",
  id,
}: AlertProps) {
  const styles = {
    error:
      "bg-red-50/90 text-red-800 dark:bg-red-950/30 dark:text-red-200 border border-red-100 dark:border-red-900/50",
    info:
      "bg-blue-50/90 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50",
    success:
      "bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900/50",
  };

  return (
    <div
      id={id}
      role={role}
      aria-live={ariaLive}
      className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  );
}
