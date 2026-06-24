"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { useConversations } from "../hooks/useConversations";
import { useJobAction } from "../hooks/useJobActions";
import { useMarkRead, useSendMessage } from "../hooks/useMessageActions";
import { useMessages } from "../hooks/useMessages";
import type { JobAction } from "../services/jobs.service";
import type { Conversation, ConversationParticipant, Message } from "../types";
import ChatPanel from "./ChatPanel";
import ConversationList from "./ConversationList";
import { avatarColorOf, initialsOf } from "./helpers";

type Role = "worker" | "employer";

function onlineOf(c: Conversation | null, presence: Record<string, boolean>) {
  if (!c) return false;
  const uid = c.participant.userId;
  if (uid && uid in presence) return presence[uid];
  return c.participant.isOnline;
}

/**
 * Build a placeholder participant for a brand-new conversation opened via
 * `?to={profileId}` before any message exists. `userId` is null (no presence
 * yet); the real participant - with colour, presence and any linked job -
 * replaces this once the first message creates the conversation server-side.
 */
function draftParticipantOf(
  toProfileId: string,
  name: string | null,
  viewerRole: Role,
): ConversationParticipant {
  const display = name?.trim() || "New message";
  return {
    id: toProfileId,
    userId: null,
    name: display,
    initials: initialsOf(display),
    role: viewerRole === "employer" ? "worker" : "employer",
    isOnline: false,
    avatarColor: avatarColorOf(display),
  };
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
  // A pending first-contact conversation (from `?to=`) that has no server row
  // yet. Also kept as a header fallback in the gap between sending the first
  // message and the conversation list refetching to include it.
  const [draft, setDraft] = useState<ConversationParticipant | null>(null);
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

  // What the chat panel renders: the real conversation when it's in the list,
  // otherwise the draft placeholder (pre-send, or during the post-send gap).
  const active: Conversation | null =
    selected ??
    (draft
      ? {
          id: selectedId ?? "",
          participant: draft,
          lastMessage: null,
          unreadCount: 0,
        }
      : null);

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

  // Once a sent draft's real conversation lands in the list, drop the
  // placeholder so the real participant (colour, presence, linked job) wins.
  useEffect(() => {
    if (selected && draft) setDraft(null);
  }, [selected, draft]);

  const selectConversation = useCallback(
    (id: string) => {
      setDraft(null);
      setSelectedId(id);
      markRead.mutate(id);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("c", id);
        url.searchParams.delete("to");
        url.searchParams.delete("name");
        window.history.replaceState(null, "", url.toString());
      }
    },
    [markRead],
  );

  // Initial selection from the URL (?c=conversationId, or ?to=profileId). For
  // a `?to=` with no existing conversation, open a draft compose panel so the
  // first message can be sent (it creates the conversation via recipientId).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || selectedId || draft || convLoading) return;
    didInit.current = true;
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const to = params.get("to");
    const name = params.get("name");
    if (c && conversations.some((x) => x.id === c)) {
      selectConversation(c);
    } else if (to) {
      const match = conversations.find((x) => x.participant.id === to);
      if (match) selectConversation(match.id);
      else setDraft(draftParticipantOf(to, name, role));
    }
  }, [convLoading, conversations, selectedId, draft, selectConversation, role]);

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
      if (!selectedId && !draft) return;
      try {
        // Existing conversation → send by id; first contact → send by
        // recipientId, which finds-or-creates the conversation server-side.
        const res = await sendMutation.mutateAsync(
          selectedId
            ? { conversationId: selectedId, content }
            : { recipientId: draft?.id, content },
        );
        const newConvId = res?.data?.data?.conversationId as string | undefined;
        const msg = res?.data?.data?.message as Message | undefined;

        if (!selectedId && newConvId) {
          // The draft just became a real conversation. Seed the message cache
          // so switching to it doesn't flash an empty thread, then select it.
          if (msg) {
            qc.setQueryData(["messages", "conversation", newConvId], {
              data: { data: [msg] },
            });
            setMessages([msg]);
          }
          setSelectedId(newConvId);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("c", newConvId);
            url.searchParams.delete("to");
            url.searchParams.delete("name");
            window.history.replaceState(null, "", url.toString());
          }
          qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
          return;
        }

        if (msg)
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
      } catch {
        /* surfaced via mutation state; keep the thread intact */
      }
    },
    [selectedId, draft, sendMutation, qc],
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
    setDraft(null);
    setOthersTyping(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("c");
      url.searchParams.delete("to");
      url.searchParams.delete("name");
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

  const hasSelection = !!(selectedId || draft);

  return (
    <div
      className={cn(
        "group font-sans text-ink grid grid-cols-1 overflow-hidden bg-white -mx-4 -mt-5 -mb-[82px] h-[calc(100dvh-112px-58px)] lg:grid-cols-[280px_1fr] lg:-mx-8 lg:-my-6 lg:h-[calc(100dvh-60px)]",
        hasSelection && "has-selection",
      )}
    >
      <ConversationList
        conversations={filtered}
        selectedId={selectedId}
        onSelect={selectConversation}
        search={search}
        onSearch={setSearch}
        presence={presence}
        loading={convLoading}
      />
      <div className="flex-col overflow-hidden bg-cream-2 min-w-0 hidden group-[.has-selection]:flex lg:flex">
        {active ? (
          <ChatPanel
            conversation={active}
            messages={selectedId ? messages : []}
            myProfileId={myProfileId}
            myName={myName}
            role={role}
            online={selected ? onlineOf(selected, presence) : false}
            othersTyping={selected ? othersTyping : false}
            loadingMessages={selectedId ? messagesQuery.isLoading : false}
            onSend={handleSend}
            onJobAction={handleJobAction}
            onTypingChange={handleTypingChange}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-1.5">
            <MessagesSquare size={48} className="text-ink-4" />
            <h3 className="text-sm font-medium text-ink-2 mt-1 mb-0">
              No messages yet
            </h3>
            <p className="text-xs text-ink-3 max-w-[280px] leading-normal m-0">
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
