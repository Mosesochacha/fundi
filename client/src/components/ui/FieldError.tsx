"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function FieldError({ error }: { error?: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1 text-[12px] text-error font-dm-sans"
        >
          <span aria-hidden="true">⚠</span> {error}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
