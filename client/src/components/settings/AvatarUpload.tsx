"use client";

import { useRef, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useAppSelector } from "@/store/hooks";
import Spinner from "@/components/ui/Spinner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface AvatarUploadProps {
  avatarUrl?: string | null;
  fullName: string;
  onSuccess: (url: string) => void;
  onRemove?: () => void;
}

export default function AvatarUpload({ avatarUrl, fullName, onSuccess, onRemove }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { accessToken } = useAppSelector((s) => s.auth);
  const { success, error } = useToastContext();

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      error("Image must be under 5MB");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      error("Only JPG, PNG, and WEBP images are allowed");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${API}/photos/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSuccess(data.data.avatarUrl);
      success("Profile photo updated");
    } catch {
      error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`${API}/photos/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onRemove?.();
      success("Profile photo removed");
    } catch {
      error("Failed to remove photo");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle */}
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-[#f97316] font-bold text-2xl overflow-hidden ring-2 ring-white shadow-md">
          {uploading ? (
            <Spinner />
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-semibold text-[#f97316] hover:text-orange-600 transition-colors disabled:opacity-50 text-left"
        >
          {uploading ? "Uploading..." : "Change photo"}
        </button>
        {avatarUrl && !uploading && (
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 text-left"
          >
            {removing ? "Removing..." : "Remove photo"}
          </button>
        )}
        <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
