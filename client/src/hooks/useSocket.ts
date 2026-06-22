"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:9000";

let socket: Socket | null = null;

export function useSocket() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;
  const initialised = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !userId || initialised.current) return;
    initialised.current = true;

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket?.emit("join", userId);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialised.current = false;
    };
  }, [isLoggedIn, userId]);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
