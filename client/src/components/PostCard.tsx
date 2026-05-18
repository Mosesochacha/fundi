"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useToggleLikeMutation, useToggleFollowMutation } from "@/store/apiSlice";

const BADGE: Record<string, string> = {
  SHOWCASE: 'bg-orange-50 text-orange-700 border-orange-200',
  TIP:      'bg-blue-50 text-blue-700 border-blue-200',
  QUESTION: 'bg-violet-50 text-violet-700 border-violet-200',
  HIRING:   'bg-green-50 text-green-700 border-green-200',
};

const BADGE_LABEL: Record<string, string> = {
  SHOWCASE: 'Showcase', TIP: 'Pro Tip', QUESTION: 'Question', HIRING: 'Hiring',
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
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function PostCard({ post: initial }: { post: Post }) {
  const { isLoggedIn, profile } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [toggleLike] = useToggleLikeMutation();
  const [toggleFollow] = useToggleFollowMutation();
  const [post, setPost] = useState(initial);
  const [isFollowing, setIsFollowing] = useState(initial.followedByMe);

  const postHref = `/post/${post.slug}`;
  const isOwnPost = profile?.username === post.author.username;

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

  const handleShare = () => {
    const url = `${window.location.origin}${postHref}`;
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

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 tabular-nums">{timeAgo(post.createdAt)}</span>
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
        </div>

        {/* Post type badge */}
        {BADGE[post.postType] && (
          <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${BADGE[post.postType]}`}>
            {BADGE_LABEL[post.postType]}
          </span>
        )}

        {/* Content */}
        <Link href={postHref} className="block group">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed group-hover:text-gray-900 transition-colors line-clamp-3">
            {post.content}
          </p>
        </Link>
        {post.content.length > 200 && (
          <Link href={postHref} className="text-xs text-orange-500 font-medium hover:underline -mt-2 block">
            Read more
          </Link>
        )}

        {/* Images */}
        {post.images?.length > 0 && (() => {
          const imgs = post.images.slice(0, 4);
          const gridClass = imgs.length > 1 ? 'grid grid-cols-2 gap-1' : '';
          const imgH = imgs.length === 1 ? 'h-64' : imgs.length <= 2 ? 'h-52' : 'h-40';
          return (
            <Link href={postHref}>
              <div className={`${gridClass} rounded-xl overflow-hidden`}>
                {imgs.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className={`w-full ${imgH} object-cover`} />
                ))}
              </div>
            </Link>
          );
        })()}

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
            <svg width="15" height="15" viewBox="0 0 24 24" fill={post.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${post.likedByMe ? 'scale-110' : ''}`}>
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            {post.likesCount > 0 && <span className="tabular-nums">{post.likesCount}</span>}
          </button>

          <Link
            href={postHref}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.commentsCount > 0 && <span className="tabular-nums">{post.commentsCount}</span>}
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all ml-auto"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
