"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import PostCard from "@/components/PostCard";
import PostCardSkeleton from "@/components/PostCardSkeleton";
import RightSidebar from "@/components/sidebar/RightSidebar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface Post {
  id: string;
  content: string;
  postType: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: { username: string; fullName: string; profession: string; location: string; avatarUrl?: string };
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

  return (
    <div className="flex gap-6 items-start">
      {/* Center feed */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Create post bar */}
        {isLoggedIn && (
          <Link
            href="/post/new"
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 shadow-sm p-3 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
              {profile?.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : profile?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-gray-400 font-dm-sans">Share your work or a tip...</span>
          </Link>
        )}

        {/* Post list */}
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>

        {/* Skeleton — initial load only (no posts yet) */}
        {loading && posts.length === 0 && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        )}

        {/* Inline spinner — loading more at bottom */}
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <p className="font-playfair font-semibold text-xl text-gray-900">No posts yet</p>
            <p className="text-sm text-gray-400 mt-1 font-dm-sans">Be the first to share something.</p>
            {isLoggedIn && (
              <Link href="/post/new" className="mt-5 inline-block bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primaryDark transition-colors font-dm-sans">
                Create a post
              </Link>
            )}
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
