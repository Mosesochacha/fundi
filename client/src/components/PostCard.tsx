"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer, Lightbulb, HelpCircle, Briefcase, MessageCircle, Share2, MoreHorizontal, Heart } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useToggleLikeMutation, useToggleFollowMutation } from "@/store/apiSlice";

type PostTypeKey = "SHOWCASE" | "TIP" | "QUESTION" | "HIRING";

const TYPE_META: Record<PostTypeKey, {
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: string;
  chipBg: string;
  chipText: string;
  chipRing: string;
}> = {
  SHOWCASE: {
    label: "Showcase",
    Icon:   Hammer,
    accent: "bg-orange-500",
    chipBg: "bg-orange-50",
    chipText: "text-orange-700",
    chipRing: "ring-orange-200/70",
  },
  TIP: {
    label: "Pro Tip",
    Icon:   Lightbulb,
    accent: "bg-emerald-500",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    chipRing: "ring-emerald-200/70",
  },
  QUESTION: {
    label: "Question",
    Icon:   HelpCircle,
    accent: "bg-sky-500",
    chipBg: "bg-sky-50",
    chipText: "text-sky-700",
    chipRing: "ring-sky-200/70",
  },
  HIRING: {
    label: "Hiring",
    Icon:   Briefcase,
    accent: "bg-violet-500",
    chipBg: "bg-violet-50",
    chipText: "text-violet-700",
    chipRing: "ring-violet-200/70",
  },
};

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
  author: {
    id: string;
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
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function PostCard({ post: initial }: { post: Post }) {
  const { isLoggedIn, profile } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [toggleLike] = useToggleLikeMutation();
  const [toggleFollow] = useToggleFollowMutation();
  const [post, setPost] = useState(initial);
  const [burst, setBurst] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initial.followedByMe);

  const postHref = `/post/${post.slug}`;
  const meta = TYPE_META[post.postType as PostTypeKey];
  const isOwnPost = profile?.username === post.author.username;

  const handleLike = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    const willLike = !post.likedByMe;
    if (willLike) {
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
    setPost((p) => ({ ...p, likedByMe: willLike, likesCount: p.likesCount + (willLike ? 1 : -1) }));
    try {
      const res = await toggleLike(post.id).unwrap();
      const data = (res as { data: { liked: boolean; likesCount: number } }).data;
      setPost((p) => ({ ...p, likedByMe: data.liked, likesCount: data.likesCount }));
    } catch {
      setPost(initial);
    }
  };

  const handleFollow = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    setIsFollowing((f) => !f);
    try {
      const res = await toggleFollow(post.author.id).unwrap();
      const data = (res as { data: { following: boolean } }).data;
      setIsFollowing(data.following);
    } catch {
      setIsFollowing(initial.followedByMe);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${postHref}`;
    if (navigator.share) {
      navigator.share({ title: post.author.fullName, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="group relative bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_1px_3px_rgba(40,20,5,0.06)] hover:shadow-[0_10px_28px_-8px_rgba(40,20,5,0.13)] hover:border-orange-200/80 transition-all duration-300 overflow-hidden">
      {/* Left accent strip — dim at rest, vivid on hover */}
      {meta && (
        <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${meta.accent} opacity-25 group-hover:opacity-100 transition-opacity duration-300`} />
      )}

      <div className="p-5 sm:p-6 space-y-4">
        {/* Author row */}
        <header className="flex items-center justify-between gap-3">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 min-w-0 group/author">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-[color:var(--orange-700)] font-bold overflow-hidden ring-2 ring-[color:var(--line)] group-hover/author:ring-orange-300 shadow-[0_2px_6px_rgba(40,20,5,0.08)] transition-all duration-200">
                {post.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.avatarUrl} alt={post.author.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-playfair">{post.author.fullName?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[14px] text-[color:var(--ink)] truncate leading-tight group-hover/author:text-primary transition-colors">
                {post.author.fullName}
              </p>
              <p className="text-[12px] text-[color:var(--ink-soft)] truncate mt-0.5 leading-tight">
                <span className="font-medium">{post.author.profession}</span>
                {post.author.location && <span className="text-gray-400"> · {post.author.location}</span>}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-gray-400 tabular-nums font-medium">{timeAgo(post.createdAt)}</span>
            {!isOwnPost && (
              <button
                onClick={handleFollow}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-all ${
                  isFollowing
                    ? "border-orange-300 text-orange-500 bg-orange-50"
                    : "border-orange-400 text-orange-500 hover:bg-orange-50"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <Link href={postHref} className="block group/content">
          <p className="text-[15px] text-[color:var(--ink)]/90 whitespace-pre-line leading-[1.65] line-clamp-4 font-dm-sans group-hover/content:text-[color:var(--ink)] transition-colors">
            {post.content}
          </p>
          {post.content.length > 240 && (
            <span className="inline-block mt-2 text-[12px] text-primary font-semibold tracking-wide hover:underline underline-offset-2 decoration-2">
              Continue reading →
            </span>
          )}
        </Link>

        {/* Images */}
        {post.images?.length > 0 && (() => {
          const imgs = post.images.slice(0, 4);
          if (imgs.length === 1) {
            return (
              <Link href={postHref} className="block rounded-xl overflow-hidden border border-[color:var(--line)] bg-[color:var(--orange-50)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgs[0]} alt="" className="w-full h-72 sm:h-80 object-cover hover:scale-[1.02] transition-transform duration-700" />
              </Link>
            );
          }
          if (imgs.length === 2) {
            return (
              <Link href={postHref} className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
                {imgs.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="w-full h-56 object-cover hover:scale-[1.03] transition-transform duration-500" />
                ))}
              </Link>
            );
          }
          return (
            <Link href={postHref} className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgs[0]} alt="" className="col-span-2 row-span-2 w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
              <div className="grid grid-rows-2 gap-1">
                {imgs.slice(1, 3).map((url, i) => (
                  <div key={i} className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 1 && imgs.length > 3 && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-playfair text-xl">
                        +{post.images.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Link>
          );
        })()}

        {/* Action bar */}
        <div className="flex items-center pt-2 -mx-1.5 border-t border-[color:var(--line-soft)]">
          <button
            onClick={handleLike}
            aria-label={post.likedByMe ? "Remove appreciation" : "Appreciate this post"}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
              post.likedByMe
                ? "text-rose-500"
                : "text-gray-400 hover:text-rose-400 hover:bg-rose-50"
            }`}
          >
            <Heart
              className={`w-[16px] h-[16px] ${post.likedByMe ? "fill-current" : ""} ${burst ? "like-burst" : ""}`}
              strokeWidth={2}
            />
            {post.likesCount > 0 && <span className="tabular-nums text-[12px]">{post.likesCount}</span>}
          </button>

          <Link
            href={postHref}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-2 rounded-lg text-gray-400 hover:text-[color:var(--ink)] hover:bg-[color:var(--line-soft)] transition-all duration-200"
          >
            <MessageCircle className="w-[16px] h-[16px]" strokeWidth={2} />
            {post.commentsCount > 0 && <span className="tabular-nums text-[12px]">{post.commentsCount}</span>}
          </Link>

          <button
            onClick={handleShare}
            aria-label={copied ? "Link copied" : "Share"}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-2 rounded-lg transition-all duration-200 ml-auto ${
              copied
                ? "text-emerald-500 bg-emerald-50"
                : "text-gray-400 hover:text-[color:var(--ink)] hover:bg-[color:var(--line-soft)]"
            }`}
          >
            <Share2 className="w-[16px] h-[16px]" strokeWidth={2} />
          </button>

          <button
            aria-label="More options"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[color:var(--ink)] hover:bg-[color:var(--line-soft)] transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
