import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={twMerge(
            clsx(
              "h-4 w-4 rounded border-gray-300 text-blue-600",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
              "dark:border-gray-600 dark:bg-gray-800",
              "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            ),
            className,
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
