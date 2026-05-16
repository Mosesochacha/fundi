"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useGetCommentsQuery } from "@/store/apiSlice";
import CommentItem, { type CommentData } from "./CommentItem";
import type { AuthProfile } from "@/store/authSlice";

interface Props {
  postId: string;
  isLoggedIn: boolean;
  currentUser: AuthProfile | null;
  replyingTo: { commentId: string; authorUsername: string } | null;
  onReplyClick: (commentId: string, authorUsername: string) => void;
}

export default function CommentList({ postId, isLoggedIn, replyingTo, onReplyClick }: Props) {
  const { data: commentsRes, isLoading } = useGetCommentsQuery(postId);
  const comments: CommentData[] = ((commentsRes as any)?.data ?? []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-24 bg-gray-100 rounded-full" />
                <div className="h-3 w-12 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full" />
              <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="font-semibold text-sm text-gray-700 px-1">
        {comments.length === 0
          ? "Comments"
          : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
      </h2>

      {/* Empty state */}
      {comments.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">No comments yet — start the conversation</p>
        </div>
      )}

      {/* Comment items */}
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          isLoggedIn={isLoggedIn}
          depth={0}
          onReplyClick={onReplyClick}
        />
      ))}
    </div>
  );
}
