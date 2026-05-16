"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, ChevronDown } from "lucide-react";
import { useToggleCommentLikeMutation } from "@/store/apiSlice";

export interface CommentData {
  id: string;
  content: string;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  parentCommentId: string | null;
  author: { username: string; fullName: string; avatarUrl?: string };
  replies: CommentData[];
}

interface Props {
  comment: CommentData;
  postId: string;
  isLoggedIn: boolean;
  depth?: number;
  onReplyClick: (commentId: string, authorUsername: string) => void;
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

function renderContent(text: string) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-primary font-medium">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const REPLIES_VISIBLE_DEFAULT = 2;

export default function CommentItem({ comment, postId, isLoggedIn, depth = 0, onReplyClick }: Props) {
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [toggleCommentLike] = useToggleCommentLikeMutation();

  const handleLike = async () => {
    if (!isLoggedIn) return;
    setLiked((p) => !p);
    setLikesCount((p) => p + (liked ? -1 : 1));
    try {
      const res = await toggleCommentLike({ postId, commentId: comment.id }).unwrap();
      const data = (res as { data: { liked: boolean; likesCount: number } }).data;
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setLiked(comment.likedByMe);
      setLikesCount(comment.likesCount);
    }
  };

  const avatarSize = depth === 0 ? "w-9 h-9" : "w-8 h-8";
  const replies = comment.replies ?? [];
  const visibleReplies = showAllReplies ? replies : replies.slice(0, REPLIES_VISIBLE_DEFAULT);
  const hiddenCount = replies.length - REPLIES_VISIBLE_DEFAULT;

  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.author.username}`} className="shrink-0">
        <div className={`${avatarSize} rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs overflow-hidden ring-2 ring-transparent hover:ring-orange-200 transition-all`}>
          {comment.author.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={comment.author.avatarUrl} alt="" className="w-full h-full object-cover" />
            : comment.author.fullName?.[0]?.toUpperCase()}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Link href={`/profile/${comment.author.username}`} className="font-semibold text-sm text-gray-900 hover:text-primary transition-colors">
              {comment.author.fullName}
            </Link>
            <span className="text-xs text-gray-400 tabular-nums">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {renderContent(comment.content)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-1 ml-1">
          <button
            onClick={handleLike}
            disabled={!isLoggedIn}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all disabled:cursor-default ${
              liked ? "text-primary" : "text-gray-400 hover:text-primary hover:bg-orange-50"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 transition-all ${liked ? "fill-current scale-110" : ""}`} />
            {likesCount > 0 && <span className="tabular-nums">{likesCount}</span>}
          </button>

          {depth === 0 && isLoggedIn && (
            <button
              onClick={() => onReplyClick(comment.id, comment.author.username)}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 border-l-2 border-orange-100 ml-3 pl-4 space-y-3">
            {visibleReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                isLoggedIn={isLoggedIn}
                depth={1}
                onReplyClick={onReplyClick}
              />
            ))}
            {!showAllReplies && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllReplies(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primaryDark transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
