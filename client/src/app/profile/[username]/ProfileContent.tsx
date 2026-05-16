"use client";

import { useState } from "react";
import { Hammer, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useGetProfileQuery, useGetProfilePostsQuery, useToggleFollowMutation } from "@/store/apiSlice";
import PostCard from "@/components/PostCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

export default function ProfileContent({ username }: { username: string }) {
  const { isLoggedIn, profile: myProfile, accessToken } = useAppSelector((s) => s.auth);
  const myProfileId = myProfile?.id;
  const router = useRouter();

  const { data: profileRes, isLoading } = useGetProfileQuery(username);
  const { data: postsRes } = useGetProfilePostsQuery({ username });
  const [toggleFollow, { isLoading: following }] = useToggleFollowMutation();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const handleMessage = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setStartingChat(true);
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: profile?.id, content: "👋 Hi!" }),
      });
      const json = await res.json();
      if (json?.data?.conversationId) {
        router.push(`/messages/${json.data.conversationId}`);
      }
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

  const profile = (profileRes as { data?: Record<string, unknown> } | undefined)?.data;
  if (!profile)
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
        Profile not found.
      </div>
    );

  const posts = ((postsRes as { data?: unknown[] } | undefined)?.data) || [];
  const followingState = isFollowing ?? (profile.isFollowing as boolean);
  const isOwnProfile = myProfileId === profile.id;

  const handleFollow = async () => {
    if (!isLoggedIn) return;
    setIsFollowing(!followingState);
    try {
      const res = await toggleFollow(profile.id as string).unwrap();
      setIsFollowing((res as { data: { following: boolean } }).data.following);
    } catch {
      setIsFollowing(followingState);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner + avatar overlap */}
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
              { label: "Posts", value: profile.postsCount },
              { label: "Followers", value: profile.followersCount },
              { label: "Views", value: profile.views },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-bold text-gray-900 text-sm">
                  {(value as number)?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Work photos grid */}
      {Array.isArray(profile.workPhotos) && (profile.workPhotos as string[]).length > 0 && (
        <>
          <h2 className="font-semibold text-sm text-gray-700 px-1">Work photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {(profile.workPhotos as string[]).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Work photo ${i + 1}`}
                className="w-full aspect-square object-cover rounded-xl border border-gray-100"
              />
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
          <p className="text-xs text-gray-400 mt-1">Their work will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts as Parameters<typeof PostCard>[0]["post"][]).map((post) => (
            <PostCard key={(post as unknown as Record<string, string>).id} post={post} />
          ))}
        </div>
      )}

      {/* Powered by footer */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Profile on{" "}
        <a href="/" className="text-primary font-medium hover:underline">
          Fundi
        </a>{" "}
        · Built for skilled workers
      </p>
    </div>
  );
}
