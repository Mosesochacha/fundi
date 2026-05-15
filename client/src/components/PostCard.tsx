"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer, MessageCircle, ArrowUpRight } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useToggleLikeMutation } from "@/store/apiSlice";

interface Post {
  id: string;
  content: string;
  postType: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: {
    username: string;
    fullName: string;
    profession: string;
    location: string;
    avatarUrl?: string;
  };
}


function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostCard({ post: initial }: { post: Post }) {
  const { isLoggedIn } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [toggleLike] = useToggleLikeMutation();
  const [post, setPost] = useState(initial);

  const handleLike = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setPost((p) => ({ ...p, likedByMe: !p.likedByMe, likesCount: p.likesCount + (p.likedByMe ? -1 : 1) }));
    try {
      const res = await toggleLike(post.id).unwrap();
      const data = (res as { data: { liked: boolean; likesCount: number } }).data;
      setPost((p) => ({ ...p, likedByMe: data.liked, likesCount: data.likesCount }));
    } catch {
      setPost(initial);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.author.fullName, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-5 space-y-4">
        {/* Author row */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 min-w-0 group">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-orange-200 transition-all">
                {post.author.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={post.author.avatarUrl} alt={post.author.fullName} className="w-full h-full object-cover" />
                  : <span className="text-sm">{post.author.fullName?.[0]?.toUpperCase()}</span>}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate leading-tight group-hover:text-primary transition-colors">
                {post.author.fullName}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5 leading-tight">
                <span className="text-gray-500 font-medium">{post.author.profession}</span>
                {post.author.location && <> &middot; {post.author.location}</>}
              </p>
            </div>
          </Link>

          <span className="text-xs text-gray-400 tabular-nums shrink-0">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Content */}
        <Link href={`/post/${post.id}`} className="block group">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed group-hover:text-gray-900 transition-colors line-clamp-5">
            {post.content}
          </p>
        </Link>

        {/* Images */}
        {post.images?.length > 0 && (
          <Link href={`/post/${post.id}`}>
            <div className={`grid gap-1 rounded-xl overflow-hidden ${post.images.length > 1 ? "grid-cols-2" : ""}`}>
              {post.images.slice(0, 4).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-full h-52 object-cover" />
              ))}
            </div>
          </Link>
        )}

        {/* Action bar */}
        <div className="flex items-center pt-1 border-t border-gray-100 -mx-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all ${
              post.likedByMe
                ? "text-primary"
                : "text-gray-400 hover:text-primary hover:bg-orange-50"
            }`}
          >
            <Hammer className={`w-[15px] h-[15px] transition-transform ${post.likedByMe ? "scale-110" : ""}`} />
            {post.likesCount > 0 && <span className="tabular-nums">{post.likesCount}</span>}
            <span className="hidden sm:inline">{post.likedByMe ? "Appreciated" : "Appreciate"}</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
          >
            <MessageCircle className="w-[15px] h-[15px]" />
            {post.commentsCount > 0 && <span className="tabular-nums">{post.commentsCount}</span>}
            <span className="hidden sm:inline">Comment</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all ml-auto"
          >
            <ArrowUpRight className="w-[15px] h-[15px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </article>
  );
}
