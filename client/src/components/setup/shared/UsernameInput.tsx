"use client";

import { CheckCircle, XCircle, Loader } from "lucide-react";

interface Props {
  value: string;
  onChange: (u: string) => void;
  available: boolean | null;
  checking: boolean;
  suggestion: string | null;
}

export default function UsernameInput({ value, onChange, available, checking, suggestion }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Your profile URL</label>
      <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-[#f97316] focus-within:ring-1 focus-within:ring-[rgba(249,115,22,0.2)] transition-all">
        <span className="px-3 py-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 shrink-0">
          fundi.co.ke/
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          placeholder="yourname"
          className="flex-1 px-3 py-3 text-sm outline-none bg-white"
        />
        <div className="px-3">
          {checking && <Loader size={16} className="text-gray-400 animate-spin" />}
          {!checking && available === true && <CheckCircle size={16} className="text-green-500" />}
          {!checking && available === false && <XCircle size={16} className="text-red-500" />}
        </div>
      </div>
      {available === false && suggestion && (
        <p className="text-xs text-gray-500 mt-1">
          That&apos;s taken. Try{" "}
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            className="text-[#f97316] underline"
          >
            {suggestion}
          </button>
        </p>
      )}
      {available === true && (
        <p className="text-xs text-green-600 mt-1">fundi.co.ke/{value} is available!</p>
      )}
    </div>
  );
}
