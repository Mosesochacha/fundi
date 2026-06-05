"use client";

import { useState } from "react";
import { Plus, X, GraduationCap, Briefcase } from "lucide-react";
import ThemeSelector from "../shared/ThemeSelector";
import ServiceTags from "../shared/ServiceTags";
import UsernameInput from "../shared/UsernameInput";
import PhotoUploadGrid from "../shared/PhotoUploadGrid";
import PublishButton from "../shared/PublishButton";
import { THEME_COLORS } from "../shared/ThemeSelector";
import AvatarUpload from "@/components/settings/AvatarUpload";
import BannerUpload from "@/components/settings/BannerUpload";
import type { SetupState, EducationItem, ExperienceItem } from "@/hooks/useProfileSetup";

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  checkUsername: (u: string) => void;
  onPublish: () => Promise<{ success: boolean; error?: string }>;
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-gray-200 text-sm font-dm-sans text-gray-900 placeholder-gray-400 outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all bg-white";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[color:var(--line)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[color:var(--line-soft)]">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 font-dm-sans">
          {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

export default function AIEditMode({ state, setField, checkUsername, onPublish }: Props) {
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const color = THEME_COLORS[state.theme] || THEME_COLORS.orange;

  const handlePublish = async () => {
    setError(null);
    const r = await onPublish();
    if (!r.success) setError(r.error || "Failed to publish");
  };

  // Education helpers
  const addEducation = () =>
    setField("education", [...state.education, { degree: "", institution: "", year: "" }]);
  const updateEducation = (i: number, patch: Partial<EducationItem>) => {
    const updated = state.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    setField("education", updated);
  };
  const removeEducation = (i: number) =>
    setField("education", state.education.filter((_, idx) => idx !== i));

  // Experience helpers
  const addExperience = () =>
    setField("experience", [...state.experience, { title: "", company: "", duration: "" }]);
  const updateExperience = (i: number, patch: Partial<ExperienceItem>) => {
    const updated = state.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    setField("experience", updated);
  };
  const removeExperience = (i: number) =>
    setField("experience", state.experience.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4 pb-10">

      {/* ── Photos & Banner ── */}
      <SectionCard title="Photo & Banner">
        <div className="space-y-4">
          <BannerUpload
            bannerUrl={state.bannerUrl || null}
            onSuccess={(url) => setField("bannerUrl", url)}
            onRemove={() => setField("bannerUrl", "")}
          />
          <AvatarUpload
            avatarUrl={state.avatarUrl || null}
            fullName={state.fullName}
            onSuccess={(url) => setField("avatarUrl", url)}
            onRemove={() => setField("avatarUrl", "")}
          />
        </div>
      </SectionCard>

      {/* ── Profile Details ── */}
      <SectionCard title="Profile Details">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500 font-dm-sans">Tagline</label>
              <span className="text-[11px] text-gray-300 font-dm-sans">{state.tagline.length}/100</span>
            </div>
            <input
              type="text"
              value={state.tagline}
              onChange={(e) => setField("tagline", e.target.value.slice(0, 100))}
              placeholder="e.g. Nairobi's most trusted electrician"
              className={inputClass}
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500 font-dm-sans">Bio</label>
              <span className="text-[11px] text-gray-300 font-dm-sans">{state.bio.length}/500</span>
            </div>
            <textarea
              value={state.bio}
              onChange={(e) => setField("bio", e.target.value.slice(0, 500))}
              placeholder="Tell people about yourself and your work..."
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-dm-sans text-gray-900 placeholder-gray-400 outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all resize-none bg-white"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Services ── */}
      <SectionCard title="Services">
        <ServiceTags
          services={state.services}
          onChange={(s) => setField("services", s)}
          themeColor={color}
        />
      </SectionCard>

      {/* ── Contact ── */}
      <SectionCard title="Contact Details">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 font-dm-sans">Phone number</label>
            <div className="flex rounded-[10px] border-[1.5px] border-gray-200 overflow-hidden focus-within:border-[#f97316] focus-within:ring-1 focus-within:ring-[rgba(249,115,22,0.2)] transition-all h-[52px]">
              <span className="flex items-center px-4 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0 font-dm-sans">
                +254
              </span>
              <input
                type="tel"
                value={state.phone}
                onChange={(e) => {
                  const v = e.target.value;
                  setField("phone", v);
                  if (whatsappSame) setField("whatsapp", v);
                }}
                placeholder="712 345 678"
                className="flex-1 px-4 text-[15px] outline-none bg-white font-dm-sans text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={whatsappSame}
              onChange={(e) => {
                setWhatsappSame(e.target.checked);
                if (e.target.checked) setField("whatsapp", state.phone);
              }}
              className="w-4 h-4 rounded accent-[#f97316]"
            />
            <span className="text-sm text-gray-600 font-dm-sans">WhatsApp is the same number</span>
          </label>
          {!whatsappSame && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 font-dm-sans">WhatsApp number</label>
              <div className="flex rounded-[10px] border-[1.5px] border-gray-200 overflow-hidden focus-within:border-[#f97316] focus-within:ring-1 focus-within:ring-[rgba(249,115,22,0.2)] transition-all h-[52px]">
                <span className="flex items-center px-4 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0 font-dm-sans">
                  +254
                </span>
                <input
                  type="tel"
                  value={state.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 px-4 text-[15px] outline-none bg-white font-dm-sans text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Work Photos ── */}
      <SectionCard title="Work Photos">
        <p className="text-xs text-gray-400 font-dm-sans -mt-1">Show clients examples of your past work</p>
        <PhotoUploadGrid
          photos={state.photos}
          onAdd={(url) => setField("photos", [...state.photos, url])}
          onRemove={(i) => setField("photos", state.photos.filter((_, idx) => idx !== i))}
        />
      </SectionCard>

      {/* ── Education ── */}
      <SectionCard title="Education">
        <div className="space-y-3">
          {state.education.map((item, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--orange-25)]">
              <GraduationCap size={16} className="text-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <input
                  value={item.degree}
                  onChange={(e) => updateEducation(i, { degree: e.target.value })}
                  placeholder="Degree or certificate"
                  className={inputClass}
                />
                <input
                  value={item.institution}
                  onChange={(e) => updateEducation(i, { institution: e.target.value })}
                  placeholder="School or institution"
                  className={inputClass}
                />
                <input
                  value={item.year ?? ""}
                  onChange={(e) => updateEducation(i, { year: e.target.value })}
                  placeholder="Year (e.g. 2019)"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeEducation(i)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 self-start"
                aria-label="Remove"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEducation}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium font-dm-sans hover:text-orange-600 transition-colors"
          >
            <Plus size={15} /> Add education
          </button>
        </div>
      </SectionCard>

      {/* ── Experience ── */}
      <SectionCard title="Experience">
        <div className="space-y-3">
          {state.experience.map((item, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--orange-25)]">
              <Briefcase size={16} className="text-gray-300 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <input
                  value={item.title}
                  onChange={(e) => updateExperience(i, { title: e.target.value })}
                  placeholder="Job title or role"
                  className={inputClass}
                />
                <input
                  value={item.company}
                  onChange={(e) => updateExperience(i, { company: e.target.value })}
                  placeholder="Company or client"
                  className={inputClass}
                />
                <input
                  value={item.duration ?? ""}
                  onChange={(e) => updateExperience(i, { duration: e.target.value })}
                  placeholder="Duration (e.g. 2019 – Present)"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeExperience(i)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 self-start"
                aria-label="Remove"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addExperience}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium font-dm-sans hover:text-orange-600 transition-colors"
          >
            <Plus size={15} /> Add experience
          </button>
        </div>
      </SectionCard>

      {/* ── Theme ── */}
      <SectionCard title="Profile Theme">
        <ThemeSelector value={state.theme} onChange={(t) => setField("theme", t)} />
      </SectionCard>

      {/* ── Username ── */}
      <SectionCard title="Your Profile URL">
        <UsernameInput
          value={state.username}
          onChange={checkUsername}
          available={state.usernameAvailable}
          checking={state.usernameChecking}
          suggestion={state.usernameSuggestion}
        />
      </SectionCard>

      {/* ── Error ── */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 font-dm-sans">{error}</p>
      )}

      {/* ── Publish ── */}
      <PublishButton
        username={state.username}
        isPublishing={state.isPublishing}
        onPublish={handlePublish}
        disabled={!state.profession || !state.location}
      />
    </div>
  );
}
