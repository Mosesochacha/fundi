"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hammer, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/features/auth";
import {
  useGetProfile,
  useGetProfilePosts,
  useToggleFollow,
} from "@/features/profiles";
import client from "@/lib/axios";
import { useToastContext } from "@/context/ToastContext";
import PostCard from "@/components/PostCard";

type Tab = "posts" | "insights" | "share";

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ icon, value, label, trend }: { icon: React.ReactNode; value: number | string; label: string; trend: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <p className="font-playfair text-2xl font-bold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="font-dm-sans text-xs text-gray-400 mt-0.5">{label}</p>
      <p className="font-dm-sans text-xs text-green-500 mt-0.5">{trend}</p>
    </div>
  );
}

const ACTIVITY_COLORS: Record<string, string> = {
  view:    "bg-orange-100 text-orange-600",
  follow:  "bg-green-100 text-green-600",
  like:    "bg-red-100 text-red-500",
  comment: "bg-blue-100 text-blue-600",
};

export default function ProfileContent({ username }: { username: string }) {
  const { isLoggedIn, profile: myProfile } = useAuth();
  const myProfileId = myProfile?.id;
  const router = useRouter();
  const { success } = useToastContext();

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [profileUrl, setProfileUrl] = useState("");

  const { data: profileRes, isLoading } = useGetProfile(username);
  const { data: postsRes } = useGetProfilePosts(username);
  const toggleFollowMutation = useToggleFollow();
  const following = toggleFollowMutation.isPending;
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const profile = profileRes as Record<string, unknown> | undefined;
  const isOwnProfile = !!profile && myProfileId === profile.id;

  // Owner-only data — skipped for other visitors
  const { data: statsRes, isFetching: statsFetching } = useQuery({
    queryKey: ["profiles", "stats"],
    queryFn: () => client.get("/profile/stats"),
    enabled: isOwnProfile,
    select: (res) => res.data,
  });
  const { data: activityRes } = useQuery({
    queryKey: ["profiles", "activity"],
    queryFn: () => client.get("/profile/activity"),
    enabled: isOwnProfile,
    select: (res) => res.data,
  });
  const { data: analyticsRes } = useQuery({
    queryKey: ["profiles", "analytics"],
    queryFn: () => client.get("/profile/analytics"),
    enabled: isOwnProfile,
    select: (res) => res.data,
  });
  const { data: fullProfileRes } = useGetProfile(
    isOwnProfile ? (myProfile?.username ?? undefined) : undefined,
  );

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUrl(`${window.location.origin}/profile/${username}`);
    }
  }, [isOwnProfile, username]);

  const handleMessage = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setStartingChat(true);
    try {
      const res = await client.post(`/messages`, {
        recipientId: profile?.id,
        content: "👋 Hi!",
      });
      const json = res.data;
      if (json?.data?.conversationId) router.push(`/messages/${json.data.conversationId}`);
    } catch {} finally {
      setStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        Profile not found.
      </div>
    );
  }

  const posts = ((postsRes as unknown[] | undefined)) ?? [];
  const followingState = isFollowing ?? (profile.isFollowing as boolean);

  const handleFollow = async () => {
    if (!isLoggedIn) return;
    setIsFollowing(!followingState);
    try {
      const res = await toggleFollowMutation.mutateAsync(profile.id as string);
      setIsFollowing((res.data as { data: { following: boolean } }).data.following);
    } catch {
      setIsFollowing(followingState);
    }
  };

  // Insights data
  const stats = (statsRes as any)?.data;
  const activity: any[] = (activityRes as any)?.data ?? [];
  const daily: any[] = (analyticsRes as any)?.data?.daily ?? [];
  const maxDaily = Math.max(...daily.map((d: any) => d.count), 1);
  const fullProfile = fullProfileRes as any;
  const profileScore = stats?.profileScore ?? 0;
  const checklistItems = [
    { label: "Profile photo", done: !!fullProfile?.avatarUrl },
    { label: "Bio written",   done: !!fullProfile?.bio },
    { label: "Phone number",  done: !!fullProfile?.phone },
    { label: "Services listed", done: (fullProfile?.services?.length ?? 0) > 0 },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => success("Profile link copied!"));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="h-28 bg-gradient-to-r from-orange-500 to-primaryDark" />
          <div className="absolute left-5 bottom-0 translate-y-1/2">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-3xl overflow-hidden ring-4 ring-white shadow-md">
              {profile.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatarUrl as string} alt={profile.fullName as string} className="w-full h-full object-cover" />
                : (profile.fullName as string)?.[0]?.toUpperCase()}
            </div>
          </div>
          {!isOwnProfile && (
            <div className="absolute right-4 bottom-0 translate-y-[calc(100%+8px)] flex gap-2">
              <button
                onClick={handleMessage}
                disabled={startingChat}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </button>
              {isLoggedIn && (
                <button
                  onClick={handleFollow}
                  disabled={following}
                  className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                    followingState
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-primary text-white hover:bg-primaryDark shadow-sm"
                  }`}
                >
                  {followingState ? "Following" : "Follow"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pt-14 pb-5">
          <h1 className="font-playfair font-bold text-xl text-gray-900 leading-tight">
            {profile.fullName as string}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {!!(profile.profession) && (
              <span className="text-xs bg-orange-50 text-primary border border-orange-100 px-2.5 py-0.5 rounded-full font-medium">
                {profile.profession as string}
              </span>
            )}
            {!!(profile.location) && (
              <span className="text-xs text-gray-400">{profile.location as string}</span>
            )}
            {!!profile.whatsapp && (
              <a
                href={`https://wa.me/${(profile.whatsapp as string).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-success font-medium hover:underline"
              >
                WhatsApp
              </a>
            )}
          </div>
          {!!profile.bio && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{profile.bio as string}</p>
          )}
          <div className="flex gap-8 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: "Posts",     value: profile.postsCount },
              { label: "Followers", value: profile.followersCount },
              { label: "Views",     value: profile.views },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-bold text-gray-900 text-sm">{(value as number)?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Owner-only tab nav */}
      {isOwnProfile && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 px-2">
            {(["posts", "insights", "share"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                  activeTab === tab
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "insights" ? "Insights" : tab === "share" ? "Share" : "Posts"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Posts (default + non-owner) */}
      {(!isOwnProfile || activeTab === "posts") && (
        <>
          {Array.isArray(profile.workPhotos) && (profile.workPhotos as string[]).length > 0 && (
            <>
              <h2 className="font-semibold text-sm text-gray-700 px-1">Work photos</h2>
              <div className="grid grid-cols-3 gap-2">
                {(profile.workPhotos as string[]).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Work photo ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border border-gray-100" />
                ))}
              </div>
            </>
          )}

          <h2 className="font-semibold text-sm text-gray-700 px-1">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <Hammer className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-gray-700">No posts yet</p>
              <p className="text-xs text-gray-400 mt-1">
                {isOwnProfile ? "Share your first piece of work." : "Their work will appear here."}
              </p>
              {isOwnProfile && (
                <Link href="/post/new" className="mt-4 inline-block text-xs bg-primary text-white px-4 py-2 rounded-xl hover:bg-primaryDark transition-colors">
                  Create a post
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(posts as Parameters<typeof PostCard>[0]["post"][]).map((post) => (
                <PostCard key={(post as unknown as Record<string, string>).id} post={post} />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB: Insights */}
      {isOwnProfile && activeTab === "insights" && (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {statsFetching ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : (
              <>
                <StatCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  value={stats?.totalViews ?? 0}
                  label="Profile views"
                  trend={`+${stats?.weeklyViews ?? 0} this week`}
                />
                <StatCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  value={stats?.followersCount ?? 0}
                  label="Followers"
                  trend={`${stats?.followingCount ?? 0} following`}
                />
                <StatCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                  value={stats?.postsCount ?? 0}
                  label="Posts"
                  trend="Keep sharing your work"
                />
                <StatCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  value={`${profileScore}%`}
                  label="Profile complete"
                  trend={profileScore < 100 ? "Add info to reach 100%" : "Fully complete!"}
                />
              </>
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-dm-sans text-sm font-semibold text-gray-900">Views this week</p>
            <p className="font-dm-sans text-xs text-gray-400 mb-4">Last 7 days</p>
            {daily.length > 0 ? (
              <div className="flex items-end gap-1.5 h-20">
                {daily.map((d: any) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative flex-1 w-full flex items-end">
                      <div
                        className="w-full bg-primary rounded-t-sm transition-all"
                        style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? "4px" : "2px" }}
                      />
                      {d.count > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                          {d.count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(d.date).toLocaleDateString("en", { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-xs text-gray-400">No view data yet</p>
              </div>
            )}
          </div>

          {/* Completeness ring */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-dm-sans text-sm font-semibold text-gray-900 mb-4">Profile strength</p>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <svg width="80" height="80" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="38" fill="none"
                    stroke="#f97316" strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={2 * Math.PI * 38 * (1 - profileScore / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-playfair text-lg font-bold text-orange-500">{profileScore}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {checklistItems.map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2">
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400 shrink-0"><circle cx="12" cy="12" r="10"/></svg>
                    )}
                    <span className={`font-dm-sans text-xs ${done ? "line-through text-gray-400" : "text-gray-700"}`}>{label}</span>
                    {!done && (
                      <Link href="/settings" className="font-dm-sans text-[10px] text-primary hover:underline ml-auto">Add</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-dm-sans text-sm font-semibold text-gray-900 mb-3">Recent activity</p>
            {activity.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No activity yet. Share your profile to get started.</p>
            ) : (
              <div>
                {activity.slice(0, 5).map((event: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 py-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${ACTIVITY_COLORS[event.type] ?? "bg-gray-100 text-gray-500"}`}>
                        {event.type === "view" ? "👁" : event.type === "follow" ? "👤" : event.type === "like" ? "👍" : "💬"}
                      </div>
                      <p className="font-dm-sans text-sm text-gray-700 flex-1">{event.message}</p>
                      <span className="font-dm-sans text-xs text-gray-400 shrink-0">{timeAgo(event.createdAt)}</span>
                    </div>
                    {i < Math.min(activity.length, 5) - 1 && <hr className="border-gray-100" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Share */}
      {isOwnProfile && activeTab === "share" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="font-dm-sans text-sm font-semibold text-gray-900">Share your profile</p>

          {/* QR code */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-orange-50 rounded-2xl">
              <QRCodeSVG
                value={profileUrl || "https://fundimtaalam.com"}
                size={120}
                fgColor="#c2410c"
                bgColor="#fff7ed"
              />
            </div>
            <p className="font-dm-sans text-xs text-gray-400">Scan to view profile</p>
          </div>

          {/* Profile URL */}
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
            <p className="font-dm-sans text-xs text-orange-700 truncate flex-1">{profileUrl || "..."}</p>
            <button onClick={copyLink} className="shrink-0 text-orange-500 hover:text-orange-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>

          {/* Share buttons */}
          <div className="space-y-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(profileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full font-dm-sans text-xs text-green-700 border border-green-300 bg-white rounded-xl px-4 py-2.5 hover:bg-green-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Share on WhatsApp
            </a>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 w-full font-dm-sans text-xs text-gray-700 border border-gray-200 bg-white rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy profile link
            </button>
            <Link
              href={`/profile/${username}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full font-dm-sans text-xs text-white bg-primary rounded-xl px-4 py-2.5 hover:bg-primaryDark transition-colors"
            >
              View public profile →
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Profile on{" "}
        <a href="/" className="text-primary font-medium hover:underline">Fundi</a>
        {" "}· Built for skilled workers
      </p>
    </div>
  );
}
