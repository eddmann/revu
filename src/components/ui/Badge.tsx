import type { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
          {
            "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300":
              variant === "default",
            "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300":
              variant === "success",
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300":
              variant === "warning",
            "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300":
              variant === "danger",
            "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300":
              variant === "info",
          },
        ),
        className,
      )}
      {...props}
    />
  );
}
