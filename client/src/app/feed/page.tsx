"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { PenSquare } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import PostCard from "@/components/PostCard";
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
  const { isLoggedIn, accessToken } = useAppSelector((s) => s.auth);
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
        {/* Post list */}
        <div className="space-y-4">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <PenSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-gray-800">Nothing here yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to share your work!</p>
            {isLoggedIn && (
              <Link href="/post/new" className="mt-5 inline-block bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primaryDark transition-colors">
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
