"use client";

import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/features/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";
import client from "@/lib/axios";

interface ScheduledPost {
  id: string;
  content: string;
  postType: string;
  scheduledAt: string;
}

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToastContext();
  const { role } = useAuth();

  useEffect(() => {
    client
      .get(`/posts/scheduled`)
      .then((r) => {
        if (Array.isArray(r.data?.data)) setPosts(r.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id: string) => {
    try {
      await client.delete(`/posts/${id}/schedule`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toastSuccess("Scheduled post cancelled.");
    } catch {
      toastError("Failed to cancel post.");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={dashboardPathForRole(role)}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900">
          Scheduled Posts
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-400">No scheduled posts</p>
          <Link
            href="/post/new"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Create a post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 line-clamp-3 flex-1">
                  {post.content}
                </p>
                <button
                  onClick={() => cancel(post.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {new Date(post.scheduledAt).toLocaleString("en-KE", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
