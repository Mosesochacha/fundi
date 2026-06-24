"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";
import FieldError from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isSuccess?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, isSuccess, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ink-2"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-[52px] px-4 rounded-[10px] border-[1.5px] text-[15px] text-ink placeholder-ink-3 outline-none transition-all duration-150 disabled:bg-cream-2 disabled:text-ink-3",
              error
                ? "border-red-600 bg-red-50"
                : isSuccess
                  ? "border-green-500 bg-green-50 focus:ring-3 focus:ring-green-500/12"
                  : "border-border bg-white focus:border-gold focus:ring-3 focus:ring-gold/12",
              isSuccess && !error && "pr-11",
              className,
            )}
            {...props}
          />
          <AnimatePresence>
            {isSuccess && !error && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-500"
                aria-hidden="true"
              >
                <Check size={16} strokeWidth={2.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <FieldError error={error} />
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export default FormInput;
