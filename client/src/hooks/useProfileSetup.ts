"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { useGenerateProfileMutation, usePublishProfileMutation, useUpdateProfileMutation, useCheckUsernamePublicQuery } from "@/store/apiSlice";

export interface EducationItem {
  degree: string;
  institution: string;
  year?: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration?: string;
}

export interface SetupState {
  path: "ai" | "manual" | null;
  phase: "questions" | "generating" | "editing" | "complete";
  step: number;
  fullName: string;
  profession: string;
  location: string;
  yearsExperience: number;
  differentiator: string;
  tagline: string;
  bio: string;
  services: string[];
  callToAction: string;
  phone: string;
  whatsapp: string;
  username: string;
  theme: string;
  photos: string[];
  avatarUrl: string;
  bannerUrl: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  isGenerating: boolean;
  isPublishing: boolean;
  usernameAvailable: boolean | null;
  usernameChecking: boolean;
  usernameSuggestion: string | null;
}

const DEFAULT_STATE: SetupState = {
  path: null,
  phase: "questions",
  step: 0,
  fullName: "",
  profession: "",
  location: "",
  yearsExperience: 0,
  differentiator: "",
  tagline: "",
  bio: "",
  services: [],
  callToAction: "",
  phone: "",
  whatsapp: "",
  username: "",
  theme: "orange",
  photos: [],
  avatarUrl: "",
  bannerUrl: "",
  education: [],
  experience: [],
  isGenerating: false,
  isPublishing: false,
  usernameAvailable: null,
  usernameChecking: false,
  usernameSuggestion: null,
};

export function useProfileSetup() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, profile, accessToken } = useAppSelector((s) => s.auth);

  const storageKey = user?.id ? `fundi_setup_${user.id}` : null;

  const [state, setState] = useState<SetupState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    if (!user?.id) return DEFAULT_STATE;
    try {
      const saved = localStorage.getItem(`fundi_setup_${user.id}`);
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch {}
    return {
      ...DEFAULT_STATE,
      fullName: profile?.fullName || `${user.firstName} ${user.lastName}`.trim(),
      username: profile?.username || "",
    };
  });

  const [usernameQuery, setUsernameQuery] = useState("");
  const usernameCheckResult = useCheckUsernamePublicQuery(usernameQuery, {
    skip: !usernameQuery || usernameQuery.length < 3,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [generateProfileMutation] = useGenerateProfileMutation();
  const [publishProfileMutation] = usePublishProfileMutation();
  const [updateProfileMutation] = useUpdateProfileMutation();

  // Persist to localStorage on every state change
  useEffect(() => {
    if (!storageKey) return;
    const { isGenerating, isPublishing, usernameAvailable, usernameChecking, usernameSuggestion, ...persisted } = state;
    localStorage.setItem(storageKey, JSON.stringify(persisted));
  }, [state, storageKey]);

  // Sync username availability from query result
  useEffect(() => {
    if (!usernameQuery) return;
    if (usernameCheckResult.isFetching) {
      setState((s) => ({ ...s, usernameChecking: true }));
      return;
    }
    if (usernameCheckResult.data?.success) {
      const d = usernameCheckResult.data.data as { available: boolean; suggestion: string | null };
      setState((s) => ({
        ...s,
        usernameAvailable: d.available,
        usernameSuggestion: d.suggestion ?? null,
        usernameChecking: false,
      }));
    }
  }, [usernameCheckResult.data, usernameCheckResult.isFetching, usernameQuery]);

  const setField = useCallback(<K extends keyof SetupState>(key: K, value: SetupState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const nextStep = useCallback(() => setState((s) => ({ ...s, step: s.step + 1 })), []);
  const prevStep = useCallback(() => setState((s) => ({ ...s, step: Math.max(0, s.step - 1) })), []);

  const checkUsername = useCallback(
    (u: string) => {
      setState((s) => ({ ...s, username: u, usernameAvailable: null, usernameChecking: u.length >= 3 }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (u.length >= 3) setUsernameQuery(u);
      }, 500);
    },
    []
  );

  const generateProfile = useCallback(async () => {
    setState((s) => ({ ...s, isGenerating: true, phase: "generating" }));
    try {
      const result = await generateProfileMutation({
        fullName: state.fullName,
        profession: state.profession,
        location: state.location,
        yearsExperience: state.yearsExperience,
        differentiator: state.differentiator,
      }).unwrap();
      const d = result.data as { tagline: string; bio: string; services: string[]; callToAction: string };
      setState((s) => ({
        ...s,
        tagline: d.tagline || s.tagline,
        bio: d.bio || s.bio,
        services: d.services?.length ? d.services : s.services,
        callToAction: d.callToAction || s.callToAction,
        isGenerating: false,
      }));
      return { success: true, data: d };
    } catch {
      setState((s) => ({ ...s, isGenerating: false }));
      return { success: false };
    }
  }, [state, generateProfileMutation]);

  const saveProfileFields = useCallback(async () => {
    const body: Record<string, unknown> = {};
    if (state.fullName) body.fullName = state.fullName;
    if (state.profession) body.profession = state.profession;
    if (state.location) body.location = state.location;
    if (state.tagline) body.tagline = state.tagline;
    if (state.bio) body.bio = state.bio;
    if (state.services.length) body.services = state.services;
    if (state.phone) body.phone = state.phone;
    if (state.whatsapp) body.whatsapp = state.whatsapp;
    if (state.username) body.username = state.username;
    if (state.theme) body.theme = state.theme;
    if (state.yearsExperience > 0) body.yearsExperience = state.yearsExperience;
    if (state.education.length) body.education = state.education;
    if (state.experience.length) body.experience = state.experience;
    await updateProfileMutation(body as Parameters<typeof updateProfileMutation>[0]).unwrap();
  }, [state, updateProfileMutation]);

  const publishProfile = useCallback(async () => {
    setState((s) => ({ ...s, isPublishing: true }));
    try {
      await saveProfileFields();
      const result = await publishProfileMutation().unwrap();
      const d = result.data as { profileUrl: string };

      // Mark user as onboarded in Redux
      if (user) {
        dispatch(setCredentials({
          user: { ...user, isOnboarded: true },
          profile: profile,
          accessToken: accessToken ?? undefined,
        }));
      }

      // Clear localStorage
      if (storageKey) localStorage.removeItem(storageKey);

      setState((s) => ({ ...s, isPublishing: false, phase: "complete" }));
      router.push("/setup/complete");
      return { success: true, profileUrl: d?.profileUrl };
    } catch (err: unknown) {
      setState((s) => ({ ...s, isPublishing: false }));
      const msg = (err as { data?: { message?: string } })?.data?.message || "Failed to publish profile";
      return { success: false, error: msg };
    }
  }, [state, saveProfileFields, publishProfileMutation, user, profile, accessToken, dispatch, storageKey, router]);

  return {
    state,
    setField,
    nextStep,
    prevStep,
    generateProfile,
    publishProfile,
    checkUsername,
  };
}
