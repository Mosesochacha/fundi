export type JobStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export interface LinkedJob {
  id: string;
  title: string;
  location: string;
  scheduledAt: string | null;
  status: JobStatus;
}

export interface ConversationParticipant {
  id: string;
  /** The participant's User id (not profile id) - used to match real-time presence events. */
  userId: string | null;
  name: string;
  initials: string;
  role: "worker" | "employer" | null;
  isOnline: boolean;
  avatarColor: string;
}

export interface ConversationLastMessage {
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
}

export interface Conversation {
  id: string;
  participant: ConversationParticipant;
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
  linkedJob?: LinkedJob;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "system";
  createdAt: string;
  readAt?: string | null;
  sender?: { id: string; fullName: string; avatarUrl?: string | null };
}
