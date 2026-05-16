import type { Metadata } from "next";
import ProfileContent from "./ProfileContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

async function fetchProfile(username: string) {
  try {
    const res = await fetch(`${API_URL}/profiles/${username}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return { title: "Profile not found — Fundi" };
  }

  const title = `${profile.fullName} — ${profile.profession} | Fundi`;
  const description =
    profile.tagline ||
    profile.bio ||
    `${profile.fullName} is a ${profile.profession} in ${profile.location} on Fundi.`;
  const images = profile.avatarUrl ? [{ url: profile.avatarUrl as string }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl as string] : [],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <ProfileContent username={username} />;
}
