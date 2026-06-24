"use client";

import {
  Briefcase,
  Check,
  CheckCheck,
  ChevronLeft,
  ImagePlus,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Send,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Conversation, JobStatus, Message } from "../types";
import { groupByDay, initialsOf, jobScheduleLabel, timeLabel } from "./helpers";

type Role = "worker" | "employer";

interface Props {
  conversation: Conversation;
  messages: Message[];
  myProfileId: string | null;
  myName: string;
  role: Role;
  online: boolean;
  othersTyping: boolean;
  loadingMessages: boolean;
  onSend: (content: string) => void;
  onJobAction: (action: "accept" | "decline" | "complete" | "cancel") => void;
  onTypingChange: (isTyping: boolean) => void;
  onBack: () => void;
}

const BANNER_VISIBLE: JobStatus[] = ["pending", "accepted"];

const ICON_BTN =
  "w-[30px] h-[30px] border-[0.5px] border-border bg-white rounded-[7px] text-ink-2 flex items-center justify-center cursor-pointer hover:border-gold hover:bg-gold-light";

export default function ChatPanel({
  conversation,
  messages,
  myProfileId,
  myName,
  role,
  online,
  othersTyping,
  loadingMessages,
  onSend,
  onJobAction,
  onTypingChange,
  onBack,
}: Props) {
  const { participant, linkedJob } = conversation;
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Scroll to newest on message change / typing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/othersTyping are intentional scroll triggers
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, othersTyping]);

  // Auto-resize the textarea up to its max height.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `text` drives the resize each keystroke
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 70)}px`;
  }, [text]);

  const emitTyping = (value: boolean) => onTypingChange(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    emitTyping(false);
    clearTimeout(typingTimer.current);
    onSend(content);
  };

  const subtitle = [
    participant.role
      ? participant.role[0].toUpperCase() + participant.role.slice(1)
      : null,
    online ? "Online" : "Offline",
    // location isn't on the conversation payload yet — omitted gracefully.
  ].filter(Boolean);

  const showBanner = linkedJob && BANNER_VISIBLE.includes(linkedJob.status);
  const groups = groupByDay(messages);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* ── Header ── */}
      <div className="bg-white border-b-[0.5px] border-border px-[18px] py-[11px] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            className="inline-flex items-center justify-center bg-transparent border-none text-ink-2 cursor-pointer p-0.5 mr-0.5 lg:hidden"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="relative shrink-0 inline-flex">
            <span
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: participant.avatarColor }}
            >
              {participant.initials}
            </span>
            {online && (
              <span className="absolute -right-px -bottom-px w-[9px] h-[9px] rounded-full bg-green-400 border-2 border-white" />
            )}
          </span>
          <div>
            <div className="text-[13px] font-medium text-ink leading-[1.2]">
              {participant.name}
            </div>
            <div className="flex items-center text-[11px] text-ink-3 mt-px">
              {subtitle.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center",
                    s === "Online" && "text-green-400",
                  )}
                >
                  {i > 0 && (
                    <span className="w-[3px] h-[3px] rounded-full bg-ink-4 mx-1.5" />
                  )}
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button type="button" className={ICON_BTN} aria-label="View profile">
            <User size={15} />
          </button>
          <button type="button" className={ICON_BTN} aria-label="Call">
            <Phone size={15} />
          </button>
          <button type="button" className={ICON_BTN} aria-label="More">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* ── Job context banner ── */}
      {showBanner && linkedJob && (
        <div className="bg-gold-light border-b-[0.5px] border-gold/20 px-[18px] py-[9px] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-[7px] bg-gold/20 text-gold flex items-center justify-center shrink-0">
              <Briefcase size={14} />
            </span>
            <div>
              <div className="text-xs font-medium text-gold-dark">
                {linkedJob.title} · {linkedJob.location}
              </div>
              <div className="text-[10px] text-gold mt-px">
                {[
                  jobScheduleLabel(linkedJob.scheduledAt),
                  bannerStatusText(linkedJob.status, role),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {renderBannerActions(linkedJob.status, role, onJobAction)}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-[18px] py-4 flex flex-col gap-2">
        {loadingMessages ? (
          <div className="text-center text-xs text-ink-3 p-5">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-6 py-10">
            <MessageSquare size={40} className="text-ink-4" />
            <p className="text-xs text-ink-3 max-w-[280px] leading-normal m-0">
              Send a message to start the conversation.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 my-1.5">
                <span className="flex-1 h-0 border-t-[0.5px] border-border" />
                <span className="text-[10px] text-ink-3">{group.label}</span>
                <span className="flex-1 h-0 border-t-[0.5px] border-border" />
              </div>
              {group.messages.map((m) => {
                if (m.type === "system") {
                  return (
                    <div key={m.id} className="flex justify-center my-0.5">
                      <span className="bg-white border-[0.5px] border-border rounded-[20px] px-3 py-1 text-[10px] text-ink-3">
                        {m.content}
                      </span>
                    </div>
                  );
                }
                const mine = m.senderId === myProfileId;
                const read = !!m.readAt;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-end gap-2 max-w-full",
                      mine && "flex-row-reverse",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0",
                        mine ? "bg-navy text-gold" : "text-white",
                      )}
                      style={
                        mine
                          ? undefined
                          : { background: participant.avatarColor }
                      }
                    >
                      {mine ? initialsOf(myName) : participant.initials}
                    </span>
                    <div
                      className={cn(
                        "flex flex-col max-w-[65%]",
                        mine && "items-end",
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs leading-[1.55] px-[13px] py-[9px] break-words whitespace-pre-wrap",
                          mine
                            ? "bg-navy text-white border-[0.5px] border-navy rounded-[12px_12px_3px_12px]"
                            : "bg-white text-ink border-[0.5px] border-border rounded-[12px_12px_12px_3px]",
                        )}
                      >
                        {m.content}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-ink-3 mt-[3px]">
                        <span>{timeLabel(m.createdAt)}</span>
                        {mine && (
                          <CheckCheck
                            size={13}
                            className={read ? "text-gold" : "text-ink-3"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {othersTyping && (
          <div className="flex items-end gap-2 max-w-full">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
              style={{ background: participant.avatarColor }}
            >
              {participant.initials}
            </span>
            <div className="inline-flex items-center gap-1 bg-white border-[0.5px] border-border rounded-[12px_12px_12px_3px] px-[13px] py-[11px]">
              <span className="w-[5px] h-[5px] rounded-full bg-ink-3 opacity-60 animate-bounce" />
              <span className="w-[5px] h-[5px] rounded-full bg-ink-3 opacity-60 animate-bounce [animation-delay:0.15s]" />
              <span className="w-[5px] h-[5px] rounded-full bg-ink-3 opacity-60 animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="bg-white border-t-[0.5px] border-border px-[18px] py-2.5 shrink-0">
        <div className="flex items-end gap-1 bg-cream border-[0.5px] border-border rounded-[10px] px-2.5 py-[7px] focus-within:border-gold focus-within:bg-white">
          <button
            type="button"
            className="w-[26px] h-[26px] border-none bg-transparent text-ink-3 rounded-md flex items-center justify-center cursor-pointer shrink-0 hover:text-ink-2"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            className="w-[26px] h-[26px] border-none bg-transparent text-ink-3 rounded-md flex items-center justify-center cursor-pointer shrink-0 hover:text-ink-2"
            aria-label="Attach photo"
          >
            <ImagePlus size={16} />
          </button>
          <textarea
            ref={textRef}
            className="flex-1 border-none bg-transparent outline-none resize-none text-xs leading-normal text-ink max-h-[70px] px-0.5 py-1 placeholder:text-ink-3"
            rows={1}
            placeholder="Type a message..."
            value={text}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            type="button"
            className="w-[30px] h-[30px] border-none rounded-[7px] bg-gold text-navy flex items-center justify-center cursor-pointer shrink-0 hover:bg-gold-dark disabled:opacity-45 disabled:cursor-default"
            onClick={submit}
            disabled={!text.trim()}
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function bannerStatusText(status: JobStatus, role: Role): string {
  if (status === "accepted") return "Accepted";
  if (status === "pending")
    return role === "worker"
      ? "Awaiting your response"
      : "Awaiting their response";
  return status;
}

const BTN_BASE =
  "inline-flex items-center gap-1 text-[11px] font-medium px-[11px] py-1.5 rounded-[7px] cursor-pointer whitespace-nowrap border-[0.5px] border-transparent";
const BTN_GOLD = `${BTN_BASE} bg-gold text-navy hover:bg-gold-dark`;
const BTN_GHOST = `${BTN_BASE} bg-transparent text-gold-dark hover:bg-gold/[0.12]`;
const BTN_OUTLINE = `${BTN_BASE} bg-white text-gold-dark border-gold/50 hover:border-gold`;

function renderBannerActions(
  status: JobStatus,
  role: Role,
  onJobAction: Props["onJobAction"],
) {
  if (role === "worker") {
    if (status === "pending") {
      return (
        <>
          <button
            type="button"
            className={BTN_GHOST}
            onClick={() => onJobAction("decline")}
          >
            Decline
          </button>
          <button
            type="button"
            className={BTN_GOLD}
            onClick={() => onJobAction("accept")}
          >
            <Check size={13} /> Accept job
          </button>
        </>
      );
    }
    // accepted
    return (
      <button
        type="button"
        className={BTN_GOLD}
        onClick={() => onJobAction("complete")}
      >
        <Check size={13} /> Mark complete
      </button>
    );
  }
  // employer
  if (status === "pending") {
    return (
      <>
        <button type="button" className={BTN_OUTLINE}>
          View request
        </button>
        <button
          type="button"
          className={BTN_GHOST}
          onClick={() => onJobAction("cancel")}
        >
          Cancel request
        </button>
      </>
    );
  }
  return (
    <span className="text-[11px] text-gold-dark font-medium">Accepted</span>
  );
}
