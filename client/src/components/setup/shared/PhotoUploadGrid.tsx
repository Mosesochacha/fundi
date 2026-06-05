"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";
import client from "@/lib/axios";

interface Props {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (i: number) => void;
}

export default function PhotoUploadGrid({ photos, onAdd, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await client.post("/photos/avatar", fd);
      const json = res.data;
      if (json.success && json.data?.avatarUrl) onAdd(json.data.avatarUrl);
    } catch {}
  };

  const slots = Array.from({ length: 6 }, (_, i) => photos[i] ?? null);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((url, i) =>
          url ? (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-[#f97316] hover:bg-orange-50 transition-colors"
            >
              <Camera size={20} className="text-gray-400" />
            </button>
          )
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
    </div>
  );
}
