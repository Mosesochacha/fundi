export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  data: {
    conversationId?: string;
    jobId?: string;
    actorName?: string;
  } | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
}
