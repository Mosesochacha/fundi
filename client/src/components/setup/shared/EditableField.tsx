"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";

interface Props {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export default function EditableField({ value, onSave, placeholder = "Click to edit", multiline = false, className = "" }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    onSave(draft);
  }, [draft, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
  }, [value]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) commit();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKey,
      className: `w-full bg-[rgba(249,115,22,0.04)] border-2 border-[#f97316] rounded-md px-2 py-1 text-inherit font-inherit outline-none resize-none ${className}`,
      style: { fontSize: "inherit", fontFamily: "inherit", lineHeight: "inherit" },
    };
    return multiline
      ? <textarea {...shared} rows={3} />
      : <input {...shared} type="text" />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`group relative cursor-pointer inline-block ${className}`}
    >
      <span className="group-hover:underline decoration-dotted decoration-gray-400">
        {value || <span className="text-gray-300 italic">{placeholder}</span>}
      </span>
      <Pencil
        size={12}
        className="inline-block ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </span>
  );
}
