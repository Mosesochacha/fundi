"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { useSocket } from "@/hooks/useSocket";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  sender: { fullName: string; avatarUrl?: string };
}

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const { accessToken, profile } = useAppSelector((s) => s.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState<{ fullName: string; avatarUrl?: string; userId?: string } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const socket = useSocket();

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/messages/${conversationId}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (Array.isArray(json?.data)) {
        setMessages(json.data);
        // Extract "other" from first message not sent by me
        const otherMsg = json.data.find((m: Message) => m.senderId !== profile?.id);
        if (otherMsg) setOther({ fullName: otherMsg.sender.fullName, avatarUrl: otherMsg.sender.avatarUrl });
      }
    } catch {}
    setLoading(false);
  }, [conversationId, accessToken, profile?.id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = ({ conversationId: cid, message }: { conversationId: string; message: Message }) => {
      if (cid !== conversationId) return;
      setMessages((prev) => [...prev, message]);
      // Mark read immediately
      fetch(`${API}/messages/${conversationId}/read`, {
        method: "POST", credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    };
    const handleTyping = ({ isTyping }: { isTyping: boolean }) => {
      setOtherTyping(isTyping);
    };
    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, conversationId, accessToken]);

  const emitTyping = (value: boolean) => {
    if (!socket || !other?.userId) return;
    socket.emit("typing", { conversationId, toUserId: other.userId, isTyping: value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    emitTyping(false);
    clearTimeout(typingTimer.current);
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: trimmed }),
      });
      const json = await res.json();
      if (json?.data?.message) {
        setMessages((prev) => [...prev, json.data.message]);
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <Link href="/messages" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {other && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#f97316] font-bold text-xs overflow-hidden">
              {other.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={other.avatarUrl} alt={other.fullName} className="w-full h-full object-cover" />
                : other.fullName[0]?.toUpperCase()}
            </div>
            <p className="font-semibold text-sm text-gray-900">{other.fullName}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === profile?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-[#f97316] text-white rounded-br-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                  <span className={`block text-[10px] mt-0.5 ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#f97316] flex items-center justify-center text-white disabled:opacity-40 hover:bg-orange-600 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
