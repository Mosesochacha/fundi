"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera, Smile, Sparkles, Clock, Globe, ChevronDown,
  X, Plus, CheckCircle, Loader2,
} from "lucide-react";
import posthog from "posthog-js";
import { useAppSelector } from "@/store/hooks";
import {
  useCreatePostMutation,
  usePolishPostMutation,
  useGetProfilePostsQuery,
} from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import RightSidebar from "@/components/sidebar/RightSidebar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

const EMOJIS = ["😊","🔥","👍","💪","✅","🙌","👏","⭐","🛠️","🏗️","⚡","🔧","🎯","💡","🤝","📸","🏠","🚿","🔌","🪚","🎨","🪣","🔨","🪛"];

const AUDIENCE_OPTIONS = [
  { value: "anyone",      label: "Anyone" },
  { value: "connections", label: "Connections only" },
  { value: "only_me",     label: "Only me" },
] as const;

type Audience = typeof AUDIENCE_OPTIONS[number]["value"];

interface ImageSlot { url: string; uploading: boolean; }

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const POST_DOT: Record<string, string> = {
  SHOWCASE: "bg-orange-400", TIP: "bg-emerald-400",
  QUESTION: "bg-sky-400",   HIRING: "bg-violet-400",
};

export default function NewPostPage() {
  const { isLoggedIn, profile, accessToken } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const { error: toastError, warning, success: toastSuccess } = useToastContext();

  const [createPost, { isLoading: creating }] = useCreatePostMutation();
  const [polishPost, { isLoading: polishing }] = usePolishPostMutation();

  // Fetch recent posts for the card below
  const { data: recentPostsData } = useGetProfilePostsQuery(
    { username: profile?.username ?? "", page: 1 },
    { skip: !profile?.username }
  );
  const recentPosts: any[] = (recentPostsData as any)?.data?.posts?.slice(0, 3) ?? [];

  // --- state ---
  const [content, setContent]               = useState("");
  const [images, setImages]                 = useState<ImageSlot[]>([]);
  const [audience, setAudience]             = useState<Audience>("anyone");
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [showAiPanel, setShowAiPanel]       = useState(false);
  const [aiNotes, setAiNotes]               = useState("");
  const [showAiConfirm, setShowAiConfirm]   = useState(false);
  const [pendingAiText, setPendingAiText]   = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [schedDate, setSchedDate]           = useState("");
  const [schedTime, setSchedTime]           = useState("");
  const [scheduledAt, setScheduledAt]       = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const minDatetime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);
  const [minDate, minTime] = minDatetime.split("T");

  // --- auth guard ---
  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Sign in to create a post.</p>
        <Link href="/login" className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  // --- helpers ---
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? content.length;
    const end   = el.selectionEnd   ?? content.length;
    const next  = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
      autoResize(el);
    });
    setShowEmojiPicker(false);
  };

  const handlePhotoFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toastError("Image must be under 5MB"); return; }
    if (images.length >= 4) { warning("Maximum 4 photos per post"); return; }
    const slot: ImageSlot = { url: URL.createObjectURL(file), uploading: true };
    setImages((prev) => [...prev, slot]);
    try {
      const formData = new FormData();
      formData.append("work", file);
      const res = await fetch(`${API}/photos/work`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setImages((prev) => prev.map((s) => s.url === slot.url ? { url: data.data.url, uploading: false } : s));
    } catch {
      toastError("Photo upload failed.");
      setImages((prev) => prev.filter((s) => s.url !== slot.url));
    }
  };

  const handleGenerate = async () => {
    if (!aiNotes.trim()) return;
    try {
      const res = await polishPost({ roughText: aiNotes, profession: profile?.profession, postType: "SHOWCASE" }).unwrap();
      const generated = (res as { data: { content: string } }).data.content;
      if (content.trim()) {
        setPendingAiText(generated);
        setShowAiConfirm(true);
      } else {
        setContent(generated);
        setAiNotes("");
        setShowAiPanel(false);
        requestAnimationFrame(() => { if (textareaRef.current) autoResize(textareaRef.current); });
      }
    } catch {
      toastError("AI assist failed. Try again.");
    }
  };

  const confirmReplace = (yes: boolean) => {
    if (yes) {
      setContent(pendingAiText);
      setAiNotes("");
      setShowAiPanel(false);
      requestAnimationFrame(() => { if (textareaRef.current) autoResize(textareaRef.current); });
    }
    setPendingAiText("");
    setShowAiConfirm(false);
  };

  const handleSchedule = () => {
    if (!schedDate || !schedTime) { warning("Pick both a date and time."); return; }
    const combined = `${schedDate}T${schedTime}`;
    if (new Date(combined) <= new Date()) { warning("Scheduled time must be in the future."); return; }
    setScheduledAt(combined);
    setShowSchedulePanel(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) { warning("Write something first.", 4000); return; }
    if (images.some((i) => i.uploading)) { warning("Wait for photos to finish uploading."); return; }
    if (scheduledAt && new Date(scheduledAt) <= new Date()) { warning("Scheduled time must be in the future.", 4000); return; }

    try {
      const payload = {
        content,
        postType: "SHOWCASE",
        images: images.map((i) => i.url),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };
      const res = await createPost(payload).unwrap();
      const data = (res as { data: { id: string; slug: string; status: string } }).data;
      posthog.capture("post_created", { postType: "SHOWCASE", scheduled: data.status === "SCHEDULED", hasImages: images.length > 0 });
      if (data.status === "SCHEDULED") {
        toastSuccess("Post scheduled!");
        router.push("/feed");
      } else {
        router.push(`/post/${data.slug}`);
      }
    } catch (err) {
      toastError((err as { data?: { error?: string } })?.data?.error || "Failed to publish post.");
    }
  };

  const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? "Anyone";
  const isPosting = creating;
  const canPost = content.trim().length > 0 && !images.some((i) => i.uploading);
  const charCount = content.length;

  const scheduledDisplay = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="flex gap-6 items-start">
      {/* ── Center column ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Scheduled banner */}
        {scheduledAt && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
            <span className="text-[13px] text-orange-700 font-dm-sans">
              Scheduled for {scheduledDisplay}
            </span>
            <button onClick={() => setScheduledAt("")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-dm-sans">
              Remove
            </button>
          </div>
        )}

        {/* ── Composer card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header row */}
          <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0">
              {profile?.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                : <span className="font-playfair">{profile?.fullName?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex flex-col gap-1.5 pt-0.5">
              <p className="text-[15px] font-semibold text-gray-900 leading-tight font-dm-sans">{profile?.fullName}</p>
              {/* Audience selector */}
              <div className="relative">
                <button
                  onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-1 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[13px] text-gray-600 font-dm-sans">{audienceLabel}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showAudienceMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAudienceMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setAudience(opt.value); setShowAudienceMenu(false); }}
                          className={`w-full text-left px-4 py-2 text-[13px] font-dm-sans transition-colors ${
                            audience === opt.value ? "text-primary bg-orange-50" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="px-5 py-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onInput={(e) => autoResize(e.currentTarget)}
              placeholder="Share what you've been working on..."
              className="w-full text-[16px] text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed font-dm-sans bg-transparent"
              style={{ minHeight: 180 }}
            />
          </div>

          {/* Photo grid */}
          {images.length > 0 && (
            <div className="px-5 pb-3">
              {images.length === 1 && (
                <div className="relative rounded-xl overflow-hidden h-[400px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[0].url} alt="" className="w-full h-full object-cover" />
                  {images[0].uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
                  <button onClick={() => setImages([])} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {images.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden h-[240px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              {images.length === 3 && (
                <div className="grid grid-cols-2 gap-2 h-[480px]">
                  <div className="relative rounded-xl overflow-hidden row-span-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[0].url} alt="" className="w-full h-full object-cover" />
                    {images[0].uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                    <button onClick={() => setImages(images.filter((_, j) => j !== 0))} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  {images.slice(1).map((img, i) => (
                    <div key={i + 1} className="relative rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
                      <button onClick={() => setImages(images.filter((_, j) => j !== i + 1))} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              {images.length === 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden h-[200px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
                      <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-700 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add more slot */}
              {images.length < 4 && !images.some((i) => i.uploading) && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full h-14 rounded-xl bg-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-200 transition-colors font-dm-sans"
                >
                  <Plus className="w-4 h-4" /> Add photo
                </button>
              )}
            </div>
          )}

          {/* AI assist panel */}
          {showAiPanel && (
            <div className="px-5 pb-3">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                <textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Describe your post in rough notes..."
                  rows={3}
                  className="w-full text-[13px] text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-dm-sans"
                />
                {showAiConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-600 font-dm-sans flex-1">Replace your current text?</span>
                    <button onClick={() => confirmReplace(true)} className="text-[13px] font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">Yes</button>
                    <button onClick={() => confirmReplace(false)} className="text-[13px] font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">No</button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={polishing || !aiNotes.trim()}
                      className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors font-dm-sans"
                    >
                      {polishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {polishing ? "Generating..." : "Generate ✨"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="relative px-5 py-3 border-t border-gray-100 flex items-center justify-between">

            {/* Emoji picker */}
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => insertEmoji(e)} className="w-9 h-9 text-xl flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Schedule panel */}
            {showSchedulePanel && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSchedulePanel(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-20 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-72">
                  <p className="text-[14px] font-semibold text-gray-900 font-dm-sans">Schedule post</p>
                  <p className="text-[13px] text-gray-400 mt-1 mb-3 font-dm-sans">Choose when to publish this post.</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={schedDate}
                      min={minDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl h-10 px-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-dm-sans"
                    />
                    <input
                      type="time"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                      className="w-28 border border-gray-200 rounded-xl h-10 px-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-dm-sans"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSchedule} className="flex-1 h-9 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors font-dm-sans">
                      Schedule
                    </button>
                    <button onClick={() => setShowSchedulePanel(false)} className="flex-1 h-9 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors font-dm-sans">
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Left icon buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 4}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                title="Add photos"
              >
                <Camera className="w-5 h-5 text-orange-500" />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => { setShowAiPanel(!showAiPanel); setShowEmojiPicker(false); setShowSchedulePanel(false); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="AI writing assist"
              >
                <Sparkles className={`w-5 h-5 ${showAiPanel ? "text-orange-500" : "text-orange-400"}`} />
              </button>
              <button
                onClick={() => { setShowSchedulePanel(!showSchedulePanel); setShowEmojiPicker(false); setShowAiPanel(false); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                title={scheduledAt ? scheduledDisplay : "Schedule post"}
              >
                <Clock className={`w-5 h-5 ${scheduledAt ? "text-orange-500" : "text-gray-400"}`} />
              </button>
            </div>

            {/* Right: char count + Post button */}
            <div className="flex items-center gap-3">
              <span className={`text-[13px] tabular-nums font-dm-sans ${charCount > 3000 ? "text-red-500" : charCount > 2500 ? "text-orange-500" : "text-gray-400"}`}>
                {charCount} / 3000
              </span>
              <button
                onClick={handleSubmit}
                disabled={!canPost || isPosting || charCount > 3000}
                className="h-9 px-6 bg-primary text-white text-[14px] font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors font-dm-sans flex items-center gap-2"
              >
                {isPosting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting...</> : scheduledAt ? "Schedule" : "Post"}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoFile(file);
            e.target.value = "";
          }}
        />

        {/* ── Posting tips card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[13px] font-semibold text-gray-900 font-dm-sans flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Tips for a great post
          </p>
          <ul className="mt-3 space-y-2.5">
            {[
              "Share the story behind your work — what was the challenge and how did you solve it?",
              "Add photos of your completed projects. Posts with photos get 3× more engagement.",
              "Tag your location so local clients can discover you more easily.",
              "End with a question to encourage comments and conversation.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-[13px] text-gray-500 leading-[1.5] font-dm-sans">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Recent posts card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-gray-900 font-dm-sans">Your recent posts</p>
            {profile?.username && (
              <Link href={`/profile/${profile.username}`} className="text-xs text-primary hover:underline font-dm-sans">
                View all →
              </Link>
            )}
          </div>
          {recentPosts.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-[13px] text-gray-400 text-center font-dm-sans">
                You haven&apos;t posted yet. Share your first post!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/post/${p.slug}`}
                  className="flex items-start gap-2.5 rounded-xl hover:bg-gray-50 p-2 -mx-2 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${POST_DOT[p.postType] ?? "bg-gray-300"}`} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-600 line-clamp-2 leading-snug font-dm-sans">
                      {p.content?.slice(0, 80)}{p.content?.length > 80 ? "…" : ""}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 font-dm-sans">
                      {timeAgo(p.createdAt)} · {p.likesCount ?? 0} likes · {p.commentsCount ?? 0} comments
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Right sidebar ── */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20">
        <RightSidebar />
      </aside>
    </div>
  );
}
