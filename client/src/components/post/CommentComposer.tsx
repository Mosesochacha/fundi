"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, X } from "lucide-react";
import { useAddCommentMutation, useSearchProfilesQuery } from "@/store/apiSlice";

const EMOJIS = [
  "😀","😂","❤️","🔥","👍","🙌","💯","🎉",
  "👏","🤔","😮","😢","💪","✨","🚀","👋",
  "🎯","💡","📌","✅","🛠️","🏆","💼","🌟",
  "🤝","📢","💬","🙏","😊","👀","⚡","🎨",
  "📱","💻","🔑","📊","🌍","⭐","🔗","📝",
];

interface Props {
  postId: string;
  currentUserAvatar?: string;
  currentUserName?: string;
  replyingTo?: { commentId: string; authorUsername: string } | null;
  onCancelReply?: () => void;
  autoFocus?: boolean;
}

interface ProfileSuggestion {
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export default function CommentComposer({
  postId,
  currentUserAvatar,
  currentUserName,
  replyingTo,
  onCancelReply,
  autoFocus,
}: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const [addComment, { isLoading: submitting }] = useAddCommentMutation();
  const { data: searchRes } = useSearchProfilesQuery(mentionQuery, {
    skip: !mentionOpen || mentionQuery.length < 2,
  });
  const mentionResults: ProfileSuggestion[] = ((searchRes as any)?.data ?? []);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  // Reset height when text clears
  useEffect(() => {
    if (!text) {
      const el = textareaRef.current;
      if (el) el.style.height = "auto";
    }
  }, [text]);

  // Close emoji popover on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  // Auto-focus when replyingTo changes
  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    autoGrow();

    // @mention detection
    const pos = e.target.selectionStart ?? 0;
    const textBefore = val.slice(0, pos);
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionOpen(true);
      setSelectedMentionIdx(0);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  };

  const insertAtCursor = (insert: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const newText = text.slice(0, start) + insert + text.slice(end);
    setText(newText);
    // Restore cursor after insert
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + insert.length, start + insert.length);
      autoGrow();
    });
  };

  const insertMention = (username: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const textBefore = text.slice(0, pos);
    const replaced = textBefore.replace(/@(\w*)$/, `@${username} `);
    const newText = replaced + text.slice(pos);
    setText(newText);
    setMentionOpen(false);
    setMentionQuery("");
    requestAnimationFrame(() => {
      el.focus();
      const newPos = replaced.length;
      el.setSelectionRange(newPos, newPos);
      autoGrow();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIdx((i) => Math.min(i + 1, mentionResults.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionResults[selectedMentionIdx].username);
        return;
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    try {
      await addComment({
        postId,
        content: text.trim(),
        ...(replyingTo ? { parentCommentId: replyingTo.commentId } : {}),
      }).unwrap();
      setText("");
      onCancelReply?.();
      setFocused(false);
    } catch {}
  };

  const showControls = focused || text.length > 0;
  const initials = currentUserName?.[0]?.toUpperCase() ?? "?";

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
          {currentUserAvatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Reply banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 mb-2 text-xs text-gray-600">
              <span>Replying to <span className="text-primary font-medium">@{replyingTo.authorUsername}</span></span>
              <button type="button" onClick={onCancelReply} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input row */}
          <div className={`flex items-end gap-2 border rounded-2xl px-3 py-2 bg-white transition-all duration-150 ${
            focused ? "border-primary ring-2 ring-primary/10" : "border-gray-200 hover:border-gray-300"
          }`}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => !text && setFocused(false)}
              autoFocus={autoFocus}
              placeholder={replyingTo ? `Reply to @${replyingTo.authorUsername}...` : "Write a comment..."}
              className="flex-1 resize-none overflow-hidden bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />

            {/* Controls */}
            <div className={`flex items-center gap-1 shrink-0 transition-opacity duration-150 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              {/* Emoji */}
              <div className="relative" ref={emojiRef}>
                <button
                  type="button"
                  onClick={() => setShowEmoji((p) => !p)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl border border-gray-100 shadow-lg p-2 grid grid-cols-8 gap-0.5 z-50 w-48">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { insertAtCursor(emoji); setShowEmoji(false); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors text-base leading-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="p-1.5 rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primaryDark transition-all disabled:cursor-default"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* @mention dropdown */}
      {mentionOpen && mentionResults.length > 0 && (
        <div className="absolute left-11 right-0 mt-1 bg-white rounded-2xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          {mentionResults.map((profile, idx) => (
            <button
              key={profile.username}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(profile.username); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                idx === selectedMentionIdx ? "bg-orange-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                {profile.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : profile.fullName?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.fullName}</p>
                <p className="text-xs text-gray-400 truncate">@{profile.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
