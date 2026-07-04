"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:9000";

let socket: Socket | null = null;
let refCount = 0;

export function useSocket() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;
  const accessToken = session?.accessToken;
  const [current, setCurrent] = useState<Socket | null>(socket);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
        auth: { token: accessToken },
      });
      socket.on("connect", () => socket?.emit("join", userId));
    }
    refCount += 1;
    setCurrent(socket);

    return () => {
      refCount -= 1;
      if (refCount <= 0) {
        socket?.disconnect();
        socket = null;
        refCount = 0;
      }
      setCurrent(null);
    };
  }, [isLoggedIn, userId, accessToken]);

  return current;
}

export function getSocket(): Socket | null {
  return socket;
}
