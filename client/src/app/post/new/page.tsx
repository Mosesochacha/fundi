"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Hammer, Lightbulb, HelpCircle, Briefcase, Sparkles, X, Clock } from "lucide-react";
import posthog from "posthog-js";
import { useAppSelector } from "@/store/hooks";
import { useCreatePostMutation, usePolishPostMutation } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";

const POST_TYPES = [
  {
    value: "SHOWCASE",
    label: "Showcase",
    hint: "Describe the job you completed — materials used, challenges overcome, time taken...",
    active: "bg-amber-50 text-amber-700 ring-1 ring-amber-300",
    idle:   "bg-gray-50 text-gray-500 hover:bg-amber-50/50 hover:text-amber-600",
    dot:    "bg-amber-400",
    Icon: Hammer,
  },
  {
    value: "TIP",
    label: "Pro Tip",
    hint: "Share a technique, shortcut, or hard-won lesson with fellow professionals...",
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300",
    idle:   "bg-gray-50 text-gray-500 hover:bg-emerald-50/50 hover:text-emerald-600",
    dot:    "bg-emerald-400",
    Icon: Lightbulb,
  },
  {
    value: "QUESTION",
    label: "Question",
    hint: "What do you need help with? Be specific — the community is here for you...",
    active: "bg-sky-50 text-sky-700 ring-1 ring-sky-300",
    idle:   "bg-gray-50 text-gray-500 hover:bg-sky-50/50 hover:text-sky-600",
    dot:    "bg-sky-400",
    Icon: HelpCircle,
  },
  {
    value: "HIRING",
    label: "Hiring",
    hint: "Describe the job — trade required, location, duration, and how to apply...",
    active: "bg-violet-50 text-violet-700 ring-1 ring-violet-300",
    idle:   "bg-gray-50 text-gray-500 hover:bg-violet-50/50 hover:text-violet-600",
    dot:    "bg-violet-400",
    Icon: Briefcase,
  },
] as const;

const STRIP_COLOR: Record<string, string> = {
  SHOWCASE: "bg-amber-400",
  TIP:      "bg-emerald-400",
  QUESTION: "bg-sky-400",
  HIRING:   "bg-violet-400",
};

export default function NewPostPage() {
  const { isLoggedIn, profile } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const [createPost, { isLoading: creating }] = useCreatePostMutation();
  const [polishPost, { isLoading: polishing }] = usePolishPostMutation();

  const [postType, setPostType] = useState<string>("SHOWCASE");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const { error: toastError, warning, success: toastSuccess } = useToastContext();

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Sign in to create a post.</p>
        <Link href="/login" className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primaryDark transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  const activeType = POST_TYPES.find((t) => t.value === postType)!;

  const handlePolish = async () => {
    if (!content.trim()) return;
    try {
      const res = await polishPost({ roughText: content, profession: profile?.profession, postType }).unwrap();
      setContent((res as { data: { content: string } }).data.content);
    } catch {
      toastError("AI assist failed. Try again.");
    }
  };

  const handleAddImage = () => {
    const url = imageInput.trim();
    if (url && images.length < 4) { setImages([...images, url]); setImageInput(""); }
  };

  const handleSubmit = async () => {
    if (!content.trim()) { warning("Write something first.", 4000); return; }
    if (scheduleEnabled && !scheduledAt) { warning("Pick a date and time to schedule.", 4000); return; }
    if (scheduleEnabled && new Date(scheduledAt) <= new Date()) { warning("Scheduled time must be in the future.", 4000); return; }

    try {
      const payload = { content, postType, images, ...(scheduleEnabled && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}) };

      const res = await createPost(payload).unwrap();
      const data = (res as { data: { id: string; slug: string; status: string } }).data;

      posthog.capture("post_created", { postType, scheduled: data.status === "SCHEDULED", hasImages: images.length > 0 });

      if (data.status === 'SCHEDULED') {
        toastSuccess("Post scheduled!");
        router.push("/feed");
      } else {
        router.push(`/post/${data.slug}`);
      }
    } catch (err) {
      toastError((err as { data?: { error?: string } })?.data?.error || "Failed to publish post.");
    }
  };

  // Min datetime: 5 minutes from now (ISO string for datetime-local input)
  const minDatetime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/feed" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900">Create Post</h1>
      </div>

      {/* Post type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {POST_TYPES.map((t) => {
          const isActive = postType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setPostType(t.value)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium text-center transition-all ${
                isActive ? t.active : t.idle
              }`}
            >
              {isActive && <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
              <t.Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Compose card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`h-[3px] w-full ${STRIP_COLOR[postType]}`} />

        <div className="p-5 space-y-4">
          {/* Author */}
          {profile && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0">
                {profile.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                  : profile.fullName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">{profile.fullName}</p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">{profile.profession}{profile.location && ` · ${profile.location}`}</p>
              </div>
            </div>
          )}

          {/* Text area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={activeType.hint}
            rows={6}
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
          />

          {/* AI assist */}
          <button
            onClick={handlePolish}
            disabled={polishing || !content.trim()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {polishing ? "Polishing..." : "Help me write this"}
          </button>
        </div>
      </div>

      {/* Image attachments — only for Showcase / Tip */}
      {(postType === "SHOWCASE" || postType === "TIP") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Attach images — paste URL (max 4)</p>
          <div className="flex gap-2">
            <input
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
              placeholder="https://..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <button
              onClick={handleAddImage}
              disabled={images.length >= 4}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-28 object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <button
          onClick={() => setScheduleEnabled(!scheduleEnabled)}
          className="flex items-center gap-2 w-full text-sm font-medium text-gray-700"
        >
          <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${scheduleEnabled ? "bg-primary" : "bg-gray-200"}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow mx-0.5 transition-transform ${scheduleEnabled ? "translate-x-4" : ""}`} />
          </div>
          <Clock className="w-4 h-4 text-gray-400" />
          Schedule for later
        </button>
        {scheduleEnabled && (
          <input
            type="datetime-local"
            value={scheduledAt}
            min={minDatetime}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={creating || !content.trim()}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-primaryDark transition-colors shadow-sm"
      >
        {creating ? (scheduleEnabled ? "Scheduling..." : "Publishing...") : scheduleEnabled ? "Schedule Post" : "Publish"}
      </button>
    </div>
  );
}
