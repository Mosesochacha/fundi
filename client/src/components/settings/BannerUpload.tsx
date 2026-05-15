"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useToastContext } from "@/context/ToastContext";
import { useAppSelector } from "@/store/hooks";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface BannerUploadProps {
  bannerUrl?: string | null;
  onSuccess: (url: string) => void;
  onRemove?: () => void;
}

export default function BannerUpload({ bannerUrl, onSuccess, onRemove }: BannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { accessToken } = useAppSelector((s) => s.auth);
  const { success, error } = useToastContext();

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      error("Banner must be under 5MB");
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
      formData.append("banner", file);
      const res = await fetch(`${API}/photos/banner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSuccess(data.data.bannerUrl);
      success("Banner updated");
    } catch {
      error("Failed to upload banner. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`${API}/photos/banner`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onRemove?.();
      success("Banner removed");
    } catch {
      error("Failed to remove banner");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 160 }}>
      {/* Banner or gradient placeholder */}
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-orange-400 to-orange-600" />
      )}

      {/* Overlay while uploading */}
      {(uploading || removing) && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-white text-sm font-medium">
            {uploading ? "Uploading..." : "Removing..."}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!uploading && !removing && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
          >
            <Camera size={14} />
            {bannerUrl ? "Change banner" : "Add banner"}
          </button>
          {bannerUrl && (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 bg-black/50 hover:bg-red-600/80 text-white text-xs font-medium px-2 py-1.5 rounded-lg transition-colors backdrop-blur-sm"
              aria-label="Remove banner"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

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
