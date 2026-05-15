"use client";

import Link from "next/link";
import { useState, use } from "react";
import { Hammer, MessageCircle, ArrowUpRight, Lightbulb, HelpCircle, Briefcase } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useGetPostQuery, useToggleLikeMutation, useGetCommentsQuery, useAddCommentMutation } from "@/store/apiSlice";

const TYPE_CONFIG: Record<string, {
  label: string;
  badge: string;
  strip: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  SHOWCASE: { label: "Showcase",  badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",   strip: "bg-amber-400",   Icon: Hammer },
  TIP:      { label: "Pro Tip",   badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200", strip: "bg-emerald-400", Icon: Lightbulb },
  QUESTION: { label: "Question",  badge: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",          strip: "bg-sky-400",     Icon: HelpCircle },
  HIRING:   { label: "Hiring",    badge: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200", strip: "bg-violet-400",  Icon: Briefcase },
};
const FALLBACK_CFG = { label: "Post", badge: "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200", strip: "bg-gray-300", Icon: Hammer };

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isLoggedIn, profile: me } = useAppSelector((s) => s.auth);

  const { data: postRes, isLoading } = useGetPostQuery(id);
  const { data: commentsRes } = useGetCommentsQuery(id);
  const [toggleLike] = useToggleLikeMutation();
  const [addComment, { isLoading: commenting }] = useAddCommentMutation();

  const [commentText, setCommentText] = useState("");
  const [likedByMe, setLikedByMe] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const post = (postRes as { data: Record<string, unknown> } | undefined)?.data;
  if (!post) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">Post not found.</div>;

  const comments = ((commentsRes as { data?: unknown[] } | undefined)?.data) || [];
  const liked = likedByMe ?? (post.likedByMe as boolean);
  const count = likesCount ?? (post.likesCount as number);
  const author = post.author as Record<string, string>;
  const cfg = TYPE_CONFIG[post.postType as string] ?? FALLBACK_CFG;
  const { Icon } = cfg;

  const handleLike = async () => {
    if (!isLoggedIn) return;
    setLikedByMe(!liked);
    setLikesCount(count + (liked ? -1 : 1));
    try {
      const res = await toggleLike(post.id as string).unwrap();
      const data = (res as { data: { liked: boolean; likesCount: number } }).data;
      setLikedByMe(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setLikedByMe(liked);
      setLikesCount(count);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: author.fullName, url });
    else navigator.clipboard.writeText(url);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ postId: post.id as string, content: commentText }).unwrap();
      setCommentText("");
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Back to feed
      </Link>

      {/* Post card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`h-[3px] w-full ${cfg.strip}`} />

        <div className="p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-start justify-between gap-3">
            <Link href={`/profile/${author.username}`} className="flex items-center gap-3 min-w-0 group">
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-orange-200 transition-all shrink-0">
                {author.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={author.avatarUrl} alt={author.fullName} className="w-full h-full object-cover" />
                  : <span className="text-sm">{author.fullName?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors truncate">{author.fullName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  <span className="text-gray-500 font-medium">{author.profession}</span>
                  {author.location && <> &middot; {author.location}</>}
                </p>
              </div>
            </Link>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}>
                <Icon className="w-3 h-3" />
                {cfg.label}
              </span>
              <span className="text-xs text-gray-400 tabular-nums">{timeAgo(post.createdAt as string)}</span>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{post.content as string}</p>

          {/* Images */}
          {(post.images as string[])?.length > 0 && (
            <div className={`grid gap-1 rounded-xl overflow-hidden ${(post.images as string[]).length > 1 ? "grid-cols-2" : ""}`}>
              {(post.images as string[]).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-full h-56 object-cover" />
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-0.5 pt-1 border-t border-gray-100 -mx-1">
            <button
              onClick={handleLike}
              disabled={!isLoggedIn}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all disabled:cursor-default ${
                liked ? "text-primary bg-orange-50" : "text-gray-500 hover:text-primary hover:bg-orange-50"
              }`}
            >
              <Hammer className={`w-4 h-4 ${liked ? "scale-110" : ""} transition-transform`} />
              <span>{count > 0 ? count : ""}</span>
              <span className="hidden sm:inline">{liked ? "Appreciated" : "Appreciate"}</span>
            </button>
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length > 0 ? comments.length : ""}</span>
              <span className="hidden sm:inline">Comments</span>
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all ml-auto"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="font-semibold text-sm text-gray-700 px-1">
          {comments.length === 0 ? "No comments yet" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
        </h2>

        {(comments as Record<string, unknown>[]).map((c) => {
          const ca = c.author as Record<string, string>;
          return (
            <div key={c.id as string} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                {ca.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={ca.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : ca.fullName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/profile/${ca.username}`} className="font-semibold text-sm text-gray-900 hover:text-primary transition-colors">
                    {ca.fullName}
                  </Link>
                  <span className="text-xs text-gray-400 tabular-nums">{timeAgo(c.createdAt as string)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content as string}</p>
              </div>
            </div>
          );
        })}

        {isLoggedIn && (
          <form onSubmit={handleComment} className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
              {me?.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                : me?.fullName?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="submit"
                disabled={commenting || !commentText.trim()}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primaryDark transition-colors"
              >
                {commenting ? "..." : "Post"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
