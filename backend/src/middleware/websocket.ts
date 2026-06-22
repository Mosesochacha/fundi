import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | undefined;

// In-memory presence: userId → number of live socket connections. A user may
// have several tabs/devices open, so we ref-count and only flip offline at zero.
const online = new Map<string, number>();

export const setupWebSocket = (server: HTTPServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : [],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Join personal room for notifications and messages
    socket.on("join", (userId: string) => {
      const id = String(userId);
      socket.data.userId = id;
      socket.join(id);

      const next = (online.get(id) ?? 0) + 1;
      online.set(id, next);
      if (next === 1) {
        io?.emit("presence", { userId: id, isOnline: true });
      }
    });

    // Typing indicators — relay to the other participant's room
    socket.on("typing", ({ conversationId, toUserId, isTyping }: { conversationId: string; toUserId: string; isTyping: boolean }) => {
      socket.to(String(toUserId)).emit("typing", { conversationId, isTyping });
    });

    socket.on("disconnect", () => {
      const id = socket.data.userId as string | undefined;
      if (!id) return;
      const next = (online.get(id) ?? 1) - 1;
      if (next <= 0) {
        online.delete(id);
        io?.emit("presence", { userId: id, isOnline: false });
      } else {
        online.set(id, next);
      }
    });
    socket.on("error", () => {});
  });
};

export const getIo = (): SocketIOServer | undefined => io;

export const isUserOnline = (userId: string | null | undefined): boolean =>
  !!userId && (online.get(String(userId)) ?? 0) > 0;
