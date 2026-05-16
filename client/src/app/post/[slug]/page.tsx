"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hammer, MessageCircle, ArrowUpRight, Lightbulb, HelpCircle, Briefcase } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  useGetPostQuery,
  useGetPostBySlugQuery,
  useToggleLikeMutation,
} from "@/store/apiSlice";
import RightSidebar from "@/components/sidebar/RightSidebar";
import PostDetailSkeleton from "@/components/post/PostDetailSkeleton";
import CommentList from "@/components/post/CommentList";
import CommentComposer from "@/components/post/CommentComposer";

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { isLoggedIn, profile: me } = useAppSelector((s) => s.auth);

  const isUUID = UUID_REGEX.test(slug);

  // Always call both hooks; skip the unused one to avoid conditional hook calls
  const { data: byIdRes, isLoading: loadingById } = useGetPostQuery(slug, { skip: !isUUID });
  const { data: bySlugRes, isLoading: loadingBySlug } = useGetPostBySlugQuery(slug, { skip: isUUID });

  const postRes = isUUID ? byIdRes : bySlugRes;
  const isLoading = isUUID ? loadingById : loadingBySlug;

  const [toggleLike] = useToggleLikeMutation();
  const [likedByMe, setLikedByMe] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorUsername: string } | null>(null);

  // Redirect UUID → clean slug URL once post loads
  useEffect(() => {
    const post = (postRes as any)?.data;
    if (isUUID && post?.slug) {
      router.replace(`/post/${post.slug}`);
    }
  }, [postRes, isUUID, router]);

  if (isLoading) return <PostDetailSkeleton />;

  const post = (postRes as { data: Record<string, unknown> } | undefined)?.data;
  if (!post) {
    return (
      <div className="flex-1 text-center py-20 text-gray-500">
        Post not found.
      </div>
    );
  }

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

  return (
    <div className="flex gap-6 items-start">
      {/* Center column */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Post card */}
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
        </article>

        {/* Comments — desktop (sm+): inline composer below list */}
        <section className="hidden sm:block space-y-4">
          <CommentList
            postId={post.id as string}
            isLoggedIn={isLoggedIn}
            currentUser={me}
            replyingTo={replyingTo}
            onReplyClick={(commentId, authorUsername) => setReplyingTo({ commentId, authorUsername })}
          />
          {isLoggedIn && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <CommentComposer
                postId={post.id as string}
                currentUserAvatar={me?.avatarUrl ?? undefined}
                currentUserName={me?.fullName}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          )}
        </section>

        {/* Comments — mobile: list only, sticky composer is fixed below */}
        <section className="sm:hidden pb-24 space-y-4">
          <CommentList
            postId={post.id as string}
            isLoggedIn={isLoggedIn}
            currentUser={me}
            replyingTo={replyingTo}
            onReplyClick={(commentId, authorUsername) => setReplyingTo({ commentId, authorUsername })}
          />
        </section>
      </div>

      {/* Right sidebar — xl only, mirrors feed layout */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20">
        <RightSidebar />
      </aside>

      {/* Mobile sticky composer — above BottomNav (h-16) */}
      {isLoggedIn && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
          <CommentComposer
            postId={post.id as string}
            currentUserAvatar={me?.avatarUrl ?? undefined}
            currentUserName={me?.fullName}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      )}
    </div>
  );
}
