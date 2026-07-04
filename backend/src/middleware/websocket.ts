import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../utils/constants";
import logger from "../utils/logger";

let io: SocketIOServer | undefined;

const online = new Map<string, number>();

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function resolveHandshakeUserId(handshake: {
  auth?: { token?: unknown };
  headers?: Record<string, unknown>;
}): string | null {
  try {
    const authToken =
      typeof handshake.auth?.token === "string" ? handshake.auth.token : undefined;
    const authHeader =
      typeof handshake.headers?.authorization === "string"
        ? (handshake.headers.authorization as string)
        : undefined;
    const bearer =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    const accessToken = authToken || bearer;
    if (accessToken) {
      const decoded = jwt.verify(accessToken, JWT_CONFIG.SECRET as string) as any;
      if (decoded?.id) return String(decoded.id);
    }

    const cookieHeader =
      typeof handshake.headers?.cookie === "string"
        ? (handshake.headers.cookie as string)
        : undefined;
    const cookies = parseCookieHeader(cookieHeader);
    const refresh = cookies["lot_r1"];
    if (refresh) {
      const decoded = jwt.verify(refresh, JWT_CONFIG.REFRESH_SECRET as string) as any;
      if (decoded?.id) return String(decoded.id);
    }
  } catch {
    return null;
  }
  return null;
}

function markOnline(userId: string) {
  const next = (online.get(userId) ?? 0) + 1;
  online.set(userId, next);
  if (next === 1) io?.emit("presence", { userId, isOnline: true });
}

function markOffline(userId: string) {
  const next = (online.get(userId) ?? 1) - 1;
  if (next <= 0) {
    online.delete(userId);
    io?.emit("presence", { userId, isOnline: false });
  } else {
    online.set(userId, next);
  }
}

export const setupWebSocket = (server: HTTPServer): void => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : [],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const userId = resolveHandshakeUserId(socket.handshake as any);
    if (!userId) {
      logger.warn("Socket auth failed: no valid credential", {
        address: socket.handshake.address,
      });
      return next(new Error("unauthorized"));
    }
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.join(userId);
    markOnline(userId);

    socket.on("join", () => {
      socket.join(userId);
    });

    socket.on(
      "typing",
      ({ conversationId, toUserId, isTyping }: { conversationId: string; toUserId: string; isTyping: boolean }) => {
        socket.to(String(toUserId)).emit("typing", { conversationId, isTyping });
      }
    );

    socket.on("disconnect", () => {
      markOffline(userId);
    });
    socket.on("error", () => {});
  });
};

export const getIo = (): SocketIOServer | undefined => io;

export const isUserOnline = (userId: string | null | undefined): boolean =>
  !!userId && (online.get(String(userId)) ?? 0) > 0;
