"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import { useSocket } from "@/hooks/useSocket";
import { useConversations } from "../hooks/useConversations";
import { useJobAction } from "../hooks/useJobActions";
import { useMarkRead, useSendMessage } from "../hooks/useMessageActions";
import { useMessages } from "../hooks/useMessages";
import type { JobAction } from "../services/jobs.service";
import type { Conversation, Message } from "../types";
import ChatPanel from "./ChatPanel";
import ConversationList from "./ConversationList";
import "./messages.css";

type Role = "worker" | "employer";

function onlineOf(c: Conversation | null, presence: Record<string, boolean>) {
  if (!c) return false;
  const uid = c.participant.userId;
  if (uid && uid in presence) return presence[uid];
  return c.participant.isOnline;
}

export default function MessagesView({
  viewerRole: role,
}: {
  viewerRole: Role;
}) {
  const { profile, user } = useAuth();
  const myProfileId = profile?.id ?? null;
  const myName =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "You";

  const qc = useQueryClient();
  const socket = useSocket();

  const { data: conversations = [], isLoading: convLoading } =
    useConversations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [othersTyping, setOthersTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch messages for the selected conversation.
  const messagesQuery = useMessages(selectedId);
  const sendMutation = useSendMessage();
  const markRead = useMarkRead();
  const jobAction = useJobAction();

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  // Sync server messages into local state (real-time appends layer on top).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed when switching conversations
  useEffect(() => {
    setMessages(messagesQuery.data ?? []);
  }, [messagesQuery.data, selectedId]);

  // Reset typing indicator when switching conversations.
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedId is the intended trigger
  useEffect(() => {
    setOthersTyping(false);
  }, [selectedId]);

  const selectConversation = useCallback(
    (id: string) => {
      setSelectedId(id);
      markRead.mutate(id);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("c", id);
        url.searchParams.delete("to");
        window.history.replaceState(null, "", url.toString());
      }
    },
    [markRead],
  );

  // Initial selection from the URL (?c=conversationId, or ?to=profileId).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || selectedId || conversations.length === 0) return;
    didInit.current = true;
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const to = params.get("to");
    if (c && conversations.some((x) => x.id === c)) {
      selectConversation(c);
    } else if (to) {
      const match = conversations.find((x) => x.participant.id === to);
      if (match) selectConversation(match.id);
    }
  }, [conversations, selectedId, selectConversation]);

  // Socket: new messages, typing, presence.
  useEffect(() => {
    if (!socket) return;
    const onNew = ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: Message;
    }) => {
      if (conversationId === selectedIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message],
        );
        markReadRef.current.mutate(conversationId);
      }
      qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
    };
    const onTyping = ({
      conversationId,
      isTyping,
    }: {
      conversationId: string;
      isTyping: boolean;
    }) => {
      if (conversationId === selectedIdRef.current) setOthersTyping(isTyping);
    };
    const onPresence = ({
      userId,
      isOnline,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      setPresence((prev) => ({ ...prev, [userId]: isOnline }));
    };
    socket.on("new_message", onNew);
    socket.on("typing", onTyping);
    socket.on("presence", onPresence);
    return () => {
      socket.off("new_message", onNew);
      socket.off("typing", onTyping);
      socket.off("presence", onPresence);
    };
  }, [socket, qc]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedId) return;
      try {
        const res = await sendMutation.mutateAsync({
          conversationId: selectedId,
          content,
        });
        const msg = res?.data?.data?.message as Message | undefined;
        if (msg)
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
      } catch {
        /* surfaced via mutation state; keep the thread intact */
      }
    },
    [selectedId, sendMutation],
  );

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      const other = selected?.participant.userId;
      if (!socket || !other || !selectedId) return;
      socket.emit("typing", {
        conversationId: selectedId,
        toUserId: other,
        isTyping,
      });
    },
    [socket, selected, selectedId],
  );

  const handleBack = useCallback(() => {
    setSelectedId(null);
    setOthersTyping(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("c");
      url.searchParams.delete("to");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const handleJobAction = useCallback(
    (action: JobAction) => {
      if (!selected?.linkedJob) return;
      jobAction.mutate({ id: selected.linkedJob.id, action });
    },
    [selected, jobAction],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.participant.name.toLowerCase().includes(q) ||
        (c.linkedJob?.title?.toLowerCase().includes(q) ?? false),
    );
  }, [conversations, search]);

  return (
    <div className={`msg${selectedId ? " has-selection" : ""}`}>
      <ConversationList
        conversations={filtered}
        selectedId={selectedId}
        onSelect={selectConversation}
        search={search}
        onSearch={setSearch}
        presence={presence}
        loading={convLoading}
      />
      <div className="msg-panel">
        {selected ? (
          <ChatPanel
            conversation={selected}
            messages={messages}
            myProfileId={myProfileId}
            myName={myName}
            role={role}
            online={onlineOf(selected, presence)}
            othersTyping={othersTyping}
            loadingMessages={messagesQuery.isLoading}
            onSend={handleSend}
            onJobAction={handleJobAction}
            onTypingChange={handleTypingChange}
            onBack={handleBack}
          />
        ) : (
          <div className="msg-empty">
            <MessagesSquare size={48} className="msg-empty-icon" />
            <h3 className="msg-empty-title">No messages yet</h3>
            <p className="msg-empty-sub">
              {role === "worker"
                ? "When employers contact you about a job, the conversation will appear here."
                : "Start a conversation by viewing a worker's profile and clicking Message."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
