"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import client from "@/lib/axios";
import { useAuth } from "@/features/auth";
import { useSocket } from "@/hooks/useSocket";

interface Conversation {
  id: string;
  other: { id: string; fullName: string; avatarUrl?: string; profession?: string; username: string };
  lastMessage?: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
}

export default function MessagesPage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await client.get("/messages/conversations");
      const json = res.data;
      if (Array.isArray(json?.data)) setConversations(json.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  // Refresh conversation list when a new message arrives
  useEffect(() => {
    if (!socket) return;
    socket.on("new_message", fetchConversations);
    return () => { socket.off("new_message", fetchConversations); };
  }, [socket, fetchConversations]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="font-playfair text-xl font-bold text-gray-900 mb-5">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-[#f97316]" />
          </div>
          <p className="text-sm font-medium text-gray-700">No messages yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Send a message from someone&apos;s profile to start a conversation
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-[#f97316] font-bold text-sm shrink-0 overflow-hidden">
                {conv.other.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={conv.other.avatarUrl} alt={conv.other.fullName} className="w-full h-full object-cover" />
                  : conv.other.fullName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${conv.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {conv.other.fullName}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-400 truncate">
                    {conv.lastMessage
                      ? `${conv.lastMessage.senderId === profile?.id ? "You: " : ""}${conv.lastMessage.content}`
                      : conv.other.profession ?? ""}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 shrink-0 min-w-[18px] h-[18px] bg-[#f97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
