import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | undefined;

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
      socket.join(String(userId));
    });

    // Typing indicators — relay to the other participant's room
    socket.on("typing", ({ conversationId, toUserId, isTyping }: { conversationId: string; toUserId: string; isTyping: boolean }) => {
      socket.to(String(toUserId)).emit("typing", { conversationId, isTyping });
    });

    socket.on("disconnect", () => {});
    socket.on("error", () => {});
  });
};

export const getIo = (): SocketIOServer | undefined => io;
