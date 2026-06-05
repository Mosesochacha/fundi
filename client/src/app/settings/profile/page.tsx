"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth";
import { useToastContext } from "@/context/ToastContext";
import { useUpdateProfile } from "@/features/settings";
import { useGetProfile, useCheckUsername } from "@/features/profiles";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsRow from "@/components/settings/SettingsRow";
import AvatarUpload from "@/components/settings/AvatarUpload";
import BannerUpload from "@/components/settings/BannerUpload";
import Button from "@/components/ui/Button";
import client from "@/lib/axios";

export default function ProfileSettingsPage() {
  const { user, profile } = useAuth();
  const { success, error } = useToastContext();
  const updateProfile = useUpdateProfile();
  const saving = updateProfile.isPending;

  // Form state
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    profession: "",
    location: "",
    tagline: "",
    bio: "",
    yearsExperience: "",
    phone: "",
    whatsapp: "",
    services: [] as string[],
  });
  const [serviceInput, setServiceInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  // Username availability check (debounced)
  const [usernameQuery, setUsernameQuery] = useState("");
  const usernameCheck = useCheckUsername(usernameQuery, usernameQuery.length > 0);
  const usernameStatus: "idle" | "checking" | "available" | "taken" =
    usernameQuery.length === 0
      ? "idle"
      : usernameCheck.isLoading
        ? "checking"
        : usernameCheck.data?.available
          ? "available"
          : "taken";

  // Load profile data
  const { data: fullProfile } = useGetProfile(profile?.username);

  useEffect(() => {
    if (!fullProfile) return;
    const p = fullProfile;
    setForm({
      fullName: p.fullName || "",
      username: p.username || "",
      profession: p.profession || "",
      location: p.location || "",
      tagline: p.tagline || "",
      bio: p.bio || "",
      yearsExperience: p.yearsExperience?.toString() || "",
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      services: Array.isArray(p.services) ? p.services : [],
    });
    setAvatarUrl(p.avatarUrl || null);
    setBannerUrl(p.bannerUrl || null);
    if (p.whatsapp && p.phone && p.whatsapp === p.phone) {
      setWhatsappSameAsPhone(true);
    }
  }, [fullProfile]);

  // Debounce username input into the availability query
  useEffect(() => {
    const val = form.username;
    if (!val || val === profile?.username) { setUsernameQuery(""); return; }
    const timer = setTimeout(() => setUsernameQuery(val), 500);
    return () => clearTimeout(timer);
  }, [form.username, profile?.username]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "phone" && whatsappSameAsPhone) {
      setForm((f) => ({ ...f, phone: value, whatsapp: value }));
    }
  };

  const addService = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && serviceInput.trim()) {
      e.preventDefault();
      if (form.services.length >= 8) { error("Maximum 8 services"); return; }
      if (!form.services.includes(serviceInput.trim())) {
        setForm((f) => ({ ...f, services: [...f.services, serviceInput.trim()] }));
      }
      setServiceInput("");
    }
  };

  const removeService = (s: string) => {
    setForm((f) => ({ ...f, services: f.services.filter((x) => x !== s) }));
  };

  const handleRegenBio = async () => {
    setRegenLoading(true);
    try {
      const res = await client.post("/ai/polish-post", {
        roughText: form.bio || `I am a ${form.profession} based in ${form.location}.`,
        profession: form.profession,
        postType: "bio",
      });
      const data = res.data;
      if (data.success && data.data?.polished) {
        setForm((f) => ({ ...f, bio: data.data.polished.slice(0, 500) }));
        success("Bio regenerated");
      }
    } catch {
      error("Failed to regenerate bio");
    } finally {
      setRegenLoading(false);
    }
  };

  const handleSave = async () => {
    if (usernameStatus === "taken") { error("Username is already taken"); return; }
    const payload: Record<string, any> = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      profession: form.profession.trim(),
      location: form.location.trim(),
      tagline: form.tagline.trim(),
      bio: form.bio.trim(),
      phone: form.phone.trim(),
      whatsapp: whatsappSameAsPhone ? form.phone.trim() : form.whatsapp.trim(),
      services: form.services,
    };
    if (form.yearsExperience) payload.yearsExperience = parseInt(form.yearsExperience);

    try {
      await updateProfile.mutateAsync(payload);
      success("Profile saved");
    } catch {
      error("Failed to save. Please try again.");
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors";

  return (
    <div className="space-y-6">
      <SettingsHeader title="Profile" description="Manage your public profile information" />

      {/* Banner + Avatar */}
      <SettingsSection title="Photo & Banner">
        <div className="py-4 space-y-4">
          <BannerUpload
            bannerUrl={bannerUrl}
            onSuccess={(url) => setBannerUrl(url)}
            onRemove={() => setBannerUrl(null)}
          />
          <AvatarUpload
            avatarUrl={avatarUrl}
            fullName={form.fullName || profile?.fullName || ""}
            onSuccess={(url) => setAvatarUrl(url)}
            onRemove={() => setAvatarUrl(null)}
          />
        </div>
      </SettingsSection>

      {/* Basic info */}
      <SettingsSection title="Basic Info">
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full name</label>
            <input className={inputClass} value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Username</label>
            <div className="relative">
              <input
                className={`${inputClass} pr-8`}
                value={form.username}
                onChange={(e) => setField("username", e.target.value.toLowerCase())}
              />
              {usernameStatus === "checking" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
              )}
              {usernameStatus === "available" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
              )}
              {usernameStatus === "taken" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">✗</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">fundi.co.ke/{form.username}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Profession</label>
            <input className={inputClass} value={form.profession} onChange={(e) => setField("profession", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Location</label>
            <input className={inputClass} value={form.location} onChange={(e) => setField("location", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Years of experience</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              max="60"
              value={form.yearsExperience}
              onChange={(e) => setField("yearsExperience", e.target.value)}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Bio & Services */}
      <SettingsSection title="Bio & Services">
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tagline</label>
            <div className="relative">
              <input
                className={inputClass}
                value={form.tagline}
                maxLength={100}
                onChange={(e) => setField("tagline", e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {form.tagline.length}/100
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500">Bio</label>
              <button
                onClick={handleRegenBio}
                disabled={regenLoading}
                className="text-xs text-[#f97316] font-medium hover:text-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {regenLoading ? "Generating..." : "✨ Regenerate with AI"}
              </button>
            </div>
            <div className="relative">
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                value={form.bio}
                maxLength={500}
                onChange={(e) => setField("bio", e.target.value)}
              />
              <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                {form.bio.length}/500
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Services <span className="text-gray-400 font-normal">({form.services.length}/8)</span>
            </label>
            <input
              className={inputClass}
              placeholder="Type a service and press Enter"
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyDown={addService}
            />
            {form.services.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.services.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 bg-orange-50 text-[#f97316] border border-orange-100 rounded-full px-3 py-1 text-xs font-medium">
                    {s}
                    <button onClick={() => removeService(s)} className="text-orange-300 hover:text-orange-600 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Contact info */}
      <SettingsSection title="Contact Info">
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 shrink-0">+254</span>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="712 345 678"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappSameAsPhone}
                onChange={(e) => {
                  setWhatsappSameAsPhone(e.target.checked);
                  if (e.target.checked) setForm((f) => ({ ...f, whatsapp: f.phone }));
                }}
                className="w-4 h-4 accent-[#f97316]"
              />
              <span className="text-sm text-gray-600">WhatsApp same as phone</span>
            </label>
            {!whatsappSameAsPhone && (
              <div className="mt-2 flex gap-2">
                <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 shrink-0">+254</span>
                <input
                  className={inputClass}
                  value={form.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  placeholder="WhatsApp number"
                />
              </div>
            )}
          </div>
          <SettingsRow label="Email address" description="Change your email in Account settings" last>
            <span className="text-sm text-gray-500">{user?.email}</span>
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Save */}
      <div className="pt-2 pb-6">
        <Button onClick={handleSave} loading={saving} fullWidth>
          Save changes
        </Button>
      </div>
    </div>
  );
}
