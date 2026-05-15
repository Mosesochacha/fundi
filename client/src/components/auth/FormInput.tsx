"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getInputStyles } from "@/lib/inputStyles";
import FieldError from "@/components/ui/FieldError";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isSuccess?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, isSuccess, id, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const { border, bg, shadow } = getInputStyles(error, isSuccess, focused);

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-[13px] font-medium text-gray-600 font-dm-sans">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              boxShadow: shadow,
              paddingRight: isSuccess && !error ? "2.75rem" : undefined,
            }}
            className={`w-full h-[52px] px-4 rounded-[10px] border-[1.5px] text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all duration-150 font-dm-sans ${border} ${bg} ${className ?? ""} disabled:bg-gray-100 disabled:text-gray-400`}
            {...props}
          />
          <AnimatePresence>
            {isSuccess && !error && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <Check size={16} strokeWidth={2.5} color="#22c55e" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <FieldError error={error} />
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
