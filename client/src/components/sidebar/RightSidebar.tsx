"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Users } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface HiringPost {
  id: string;
  content: string;
  createdAt: string;
  author: { fullName: string; profession: string; avatarUrl?: string; username: string };
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function RightSidebar() {
  const { accessToken, profile: me } = useAppSelector((s) => s.auth);
  const [hiringPosts, setHiringPosts] = useState<HiringPost[]>([]);

  useEffect(() => {
    const fetchHiring = async () => {
      try {
        const res = await fetch(`${API}/feed?type=hiring&page=1&limit=6`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const json = await res.json();
        if (json.success) setHiringPosts(json.data.posts ?? []);
      } catch {}
    };
    fetchHiring();
  }, [accessToken]);

  const suggestedPeople = Array.from(
    new Map(hiringPosts.map((p) => [p.author.username, p.author])).values()
  )
    .filter((a) => a.username !== me?.username)
    .slice(0, 3);

  const displayedHiring = hiringPosts.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Open Roles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-800">Open Roles</h3>
        </div>

        {displayedHiring.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No open roles right now.</p>
        ) : (
          <div className="space-y-3">
            {displayedHiring.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0 overflow-hidden">
                    {post.author.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : post.author.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                      {post.author.fullName}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-0.5">
                      {post.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/feed"
          className="block mt-3 text-xs text-primary font-medium hover:underline"
        >
          See all open roles →
        </Link>
      </div>

      {/* Active Professionals */}
      {suggestedPeople.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-gray-800">Active Professionals</h3>
          </div>
          <div className="space-y-3">
            {suggestedPeople.map((person) => (
              <Link
                key={person.username}
                href={`/profile/${person.username}`}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                  {person.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : person.fullName?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                    {person.fullName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{person.profession}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
