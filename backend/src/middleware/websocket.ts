import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import db from "../models";

let io: SocketIOServer | undefined;

export const setupWebSocket = (server: HTTPServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : [],
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId as string;
    
    // Minimal: personal room join for notifications only
    socket.on("join", (userId: string) => {
      socket.join(String(userId));
    });

    socket.on("disconnect", (reason) => {
      // Connection closed
    });

    socket.on("error", (error) => {
      // Socket error handled
    });
  });
};

export const getIo = (): SocketIOServer | undefined => io;


