import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center font-medium rounded-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            {
              "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600":
                variant === "primary",
              "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600":
                variant === "secondary",
              "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800":
                variant === "ghost",
              "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600":
                variant === "danger",
              "px-2 py-1 text-xs": size === "sm",
              "px-3 py-1.5 text-sm": size === "md",
              "px-4 py-2 text-base": size === "lg",
            },
          ),
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
