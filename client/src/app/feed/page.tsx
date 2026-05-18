"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Sparkles, PenSquare } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import PostCard from "@/components/PostCard";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import RightSidebar from "@/components/sidebar/RightSidebar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface Post {
  id: string;
  slug: string;
  content: string;
  postType: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  followedByMe: boolean;
  createdAt: string;
  author: { id: string; username: string; fullName: string; profession: string; location: string; avatarUrl?: string };
}

export default function FeedPage() {
  const { isLoggedIn, accessToken, profile } = useAppSelector((s) => s.auth);
  const token = accessToken;
  const { postType, dateRange, profession, location } = useAppSelector((s) => s.feed);

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(page);

  useEffect(() => { pageRef.current = page; }, [page]);

  const fetchPosts = useCallback(async (pageNum: number, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: postType,
        dateRange,
        profession,
        location,
        page: String(pageNum),
        limit: "10",
      });
      const res = await fetch(`${API}/feed?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        const { posts: newPosts, hasMore: more } = json.data;
        setPosts((prev) => replace ? newPosts : [...prev, ...newPosts]);
        setHasMore(more);
        setPage(pageNum);
      }
    } catch {}
    loadingRef.current = false;
    setLoading(false);
  }, [token, postType, dateRange, profession, location]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        fetchPosts(pageRef.current + 1);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, fetchPosts]);

  const today = new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex gap-6 items-start">
      {/* Center feed */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Editorial date header */}
        <div className="hidden sm:block px-1 pb-3 border-b border-[color:var(--line)]">
          <div className="flex items-baseline justify-between">
            <h1 className="font-playfair text-[28px] font-bold text-[color:var(--ink)] leading-none tracking-tight">
              Today on Fundi
            </h1>
            <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-medium tabular-nums">
              {today}
            </span>
          </div>
        </div>

        {/* Create post bar */}
        {isLoggedIn && (
          <Link
            href="/post/new"
            className="flex items-center gap-3 bg-white rounded-2xl border border-[color:var(--line)] hover:border-orange-200 hover:shadow-[0_6px_20px_-6px_rgba(40,20,5,0.12)] shadow-[0_1px_3px_rgba(40,20,5,0.05)] p-3 pl-4 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[color:var(--orange-700)] font-bold text-sm shrink-0 overflow-hidden ring-2 ring-[color:var(--line)] group-hover:ring-orange-200 transition-all shadow-[0_1px_4px_rgba(40,20,5,0.08)]">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-playfair">{profile?.fullName?.[0]?.toUpperCase() ?? '?'}</span>
              )}
            </div>
            <span className="text-[14px] text-gray-400 font-dm-sans flex-1">
              Share your work or a tip, <span className="text-[color:var(--ink)] font-medium">{profile?.fullName?.split(" ")[0] ?? "friend"}</span>...
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-primary bg-orange-50 px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all shadow-[inset_0_0_0_1px_rgba(249,115,22,0.2)] group-hover:shadow-[0_2px_8px_-2px_rgba(249,115,22,0.4)]">
              <PenSquare className="w-3.5 h-3.5" strokeWidth={2.5} />
              Post
            </span>
          </Link>
        )}

        {/* Post list */}
        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <div
                key={post.id}
                className="reveal"
                style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}

        {/* Skeleton — initial load only */}
        {loading && posts.length === 0 && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        )}

        {/* Inline spinner — loading more at bottom */}
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading
            </div>
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />

        {/* End of feed */}
        {!loading && !hasMore && posts.length > 0 && (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium">
              <span className="h-px w-12 bg-[color:var(--line)]" />
              You&apos;re all caught up
              <span className="h-px w-12 bg-[color:var(--line)]" />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="relative overflow-hidden text-center py-16 px-6 bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_1px_3px_rgba(40,20,5,0.05)]">
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(circle at 50% 0%, rgba(249,115,22,0.07), transparent 65%)",
            }} />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/60 flex items-center justify-center mx-auto mb-5 shadow-[0_4px_16px_-4px_rgba(249,115,22,0.2)]">
                <Sparkles className="w-7 h-7 text-primary" strokeWidth={2} />
              </div>
              <p className="font-playfair font-bold text-2xl text-[color:var(--ink)] leading-tight">
                The page is still wet
              </p>
              <p className="text-sm text-[color:var(--ink-soft)] mt-2 font-dm-sans max-w-sm mx-auto leading-relaxed">
                No posts match your filters yet. Be the first to share a piece of work or a tip from the trade.
              </p>
              {isLoggedIn && (
                <Link
                  href="/post/new"
                  className="mt-6 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[color:var(--orange-600)] transition-all shadow-[0_2px_12px_-2px_rgba(249,115,22,0.45)] hover:-translate-y-px"
                >
                  <PenSquare className="w-4 h-4" strokeWidth={2.5} />
                  Create the first post
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar — xl only */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20">
        <RightSidebar />
      </aside>
    </div>
  );
}
