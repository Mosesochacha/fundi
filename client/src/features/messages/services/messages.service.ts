import client from "@/lib/axios";

export interface SendMessageInput {
  conversationId?: string;
  recipientId?: string;
  content: string;
}

export const messagesService = {
  getConversations: () => client.get("/messages/conversations"),
  getMessages: (conversationId: string) =>
    client.get(`/messages/${conversationId}`),
  send: (data: SendMessageInput) => client.post("/messages", data),
  markRead: (conversationId: string) =>
    client.post(`/messages/${conversationId}/read`),
};
