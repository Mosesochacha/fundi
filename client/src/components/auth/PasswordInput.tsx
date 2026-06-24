"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, useState } from "react";
import FieldError from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  showStrength?: boolean;
  watchValue?: string;
  isSuccess?: boolean;
}

function getStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0;
  if (value.length < 8) return 1;
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[^a-zA-Z0-9]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  if (hasNumber && hasSpecial && hasUpper) return 4;
  if (hasNumber && hasSpecial) return 3;
  return 2;
}

const strengthConfig = [
  null,
  { label: "Weak", color: "#dc2626" },
  { label: "Fair", color: "#f59e0b" },
  { label: "Good", color: "#65a30d" },
  { label: "Strong", color: "#16a34a" },
] as const;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      showStrength,
      watchValue = "",
      isSuccess,
      id,
      className,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    const strength = showStrength ? getStrength(watchValue) : 0;
    const strengthInfo = strengthConfig[strength];

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-ink-2"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "w-full h-[52px] pl-4 rounded-[10px] border-[1.5px] text-[15px] text-ink placeholder-ink-3 outline-none transition-all duration-150",
              error
                ? "border-red-600 bg-red-50"
                : isSuccess
                  ? "border-green-500 bg-green-50 focus:ring-3 focus:ring-green-500/12"
                  : "border-border bg-white focus:border-gold focus:ring-3 focus:ring-gold/12",
              isSuccess && !error ? "pr-11" : "pr-12",
              className,
            )}
            {...props}
          />
          {isSuccess && !error && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8l3.5 3.5L13 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-ink-3 hover:text-ink-2 transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {showStrength && watchValue && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background:
                      strength >= level && strengthInfo
                        ? strengthInfo.color
                        : "#e5e0d5",
                  }}
                />
              ))}
            </div>
            {strengthInfo && (
              <p
                className="text-[11px] font-medium"
                style={{ color: strengthInfo.color }}
              >
                {strengthInfo.label}
              </p>
            )}
          </div>
        )}

        <FieldError error={error} />
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
