import client from "@/lib/axios";

export const notificationsService = {
  list: () => client.get("/notifications"),
  markRead: (id: string) => client.post(`/notifications/${id}/read`),
  markAllRead: () => client.post("/notifications/read-all"),
};
