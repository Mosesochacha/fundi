"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use as useParams } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetPostQuery,
  useGetPostBySlugQuery,
} from "@/store/apiSlice";
import RightSidebar from "@/components/sidebar/RightSidebar";
import PostDetailSkeleton from "@/components/post/PostDetailSkeleton";
import CommentList from "@/components/post/CommentList";
import CommentComposer from "@/components/post/CommentComposer";
import PostCard from "@/components/PostCard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { isLoggedIn, profile: me } = useAppSelector((s) => s.auth);

  const isUUID = UUID_REGEX.test(slug);

  const { data: byIdRes, isLoading: loadingById } = useGetPostQuery(slug, { skip: !isUUID });
  const { data: bySlugRes, isLoading: loadingBySlug } = useGetPostBySlugQuery(slug, { skip: isUUID });

  const postRes = isUUID ? byIdRes : bySlugRes;
  const isLoading = isUUID ? loadingById : loadingBySlug;

  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorUsername: string } | null>(null);

  useEffect(() => {
    const post = (postRes as any)?.data;
    if (isUUID && post?.slug) {
      router.replace(`/post/${post.slug}`);
    }
  }, [postRes, isUUID, router]);

  if (isLoading) return <PostDetailSkeleton />;

  const raw = (postRes as any)?.data;
  if (!raw) {
    return <div className="flex-1 text-center py-20 text-gray-500">Post not found.</div>;
  }

  // Normalise to the shape PostCard expects
  const post = {
    id:            raw.id as string,
    slug:          raw.slug as string,
    content:       raw.content as string,
    postType:      raw.postType as string,
    images:        (raw.images as string[]) ?? [],
    likesCount:    raw.likesCount as number,
    commentsCount: raw.commentsCount as number,
    likedByMe:     raw.likedByMe as boolean,
    followedByMe:  raw.followedByMe as boolean ?? false,
    createdAt:     raw.createdAt as string,
    author: {
      id:         (raw.author as any)?.id as string,
      username:   (raw.author as any)?.username as string,
      fullName:   (raw.author as any)?.fullName as string,
      profession: (raw.author as any)?.profession as string,
      location:   (raw.author as any)?.location as string,
      avatarUrl:  (raw.author as any)?.avatarUrl as string | undefined,
    },
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Center column */}
      <div className="flex-1 min-w-0 space-y-4">

        <PostCard post={post} full />

        {/* Comments — desktop */}
        <section className="hidden sm:block space-y-4">
          <CommentList
            postId={raw.id as string}
            isLoggedIn={isLoggedIn}
            currentUser={me}
            replyingTo={replyingTo}
            onReplyClick={(commentId, authorUsername) => setReplyingTo({ commentId, authorUsername })}
          />
          {isLoggedIn && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <CommentComposer
                postId={raw.id as string}
                currentUserAvatar={me?.avatarUrl ?? undefined}
                currentUserName={me?.fullName}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          )}
        </section>

        {/* Comments — mobile */}
        <section className="sm:hidden pb-24 space-y-4">
          <CommentList
            postId={raw.id as string}
            isLoggedIn={isLoggedIn}
            currentUser={me}
            replyingTo={replyingTo}
            onReplyClick={(commentId, authorUsername) => setReplyingTo({ commentId, authorUsername })}
          />
        </section>
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0 sticky top-20">
        <RightSidebar />
      </aside>

      {/* Mobile sticky composer */}
      {isLoggedIn && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
          <CommentComposer
            postId={raw.id as string}
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
