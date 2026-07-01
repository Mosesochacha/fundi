import client from "@/lib/axios";

export interface SendMessageInput {
  conversationId?: string;
  recipientId?: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export const messagesService = {
  getConversations: () => client.get("/messages/conversations"),
  getMessages: (conversationId: string) =>
    client.get(`/messages/${conversationId}`),
  send: (data: SendMessageInput) => client.post("/messages", data),
  markRead: (conversationId: string) =>
    client.post(`/messages/${conversationId}/read`),
  /** Upload a chat image; returns { url, type }. */
  uploadAttachment: (file: File) => {
    const form = new FormData();
    form.append("message", file);
    return client.post("/messages/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
