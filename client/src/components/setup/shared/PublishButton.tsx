"use client";

import { Globe, Check, Loader } from "lucide-react";

interface Props {
  username: string;
  isPublishing: boolean;
  onPublish: () => void;
  disabled?: boolean;
}

export default function PublishButton({ username, isPublishing, onPublish, disabled }: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={onPublish}
        disabled={disabled || isPublishing}
        className="w-full flex items-center justify-center gap-2 rounded-xl text-white font-semibold text-base transition-all disabled:opacity-60"
        style={{ height: 56, backgroundColor: isPublishing ? "#22c55e" : "#f97316" }}
      >
        {isPublishing ? (
          <>
            <Loader size={18} className="animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Globe size={18} />
            Publish my profile
            <Check size={18} className="hidden" />
          </>
        )}
      </button>
      {username && (
        <p className="text-center text-xs text-gray-400 mt-2">
          fundi.co.ke/{username} will go live
        </p>
      )}
    </div>
  );
}
