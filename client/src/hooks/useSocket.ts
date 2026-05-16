"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:9000";

let socket: Socket | null = null;

export function useSocket() {
  const { isLoggedIn, user } = useAppSelector((s) => s.auth);
  const initialised = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || initialised.current) return;
    initialised.current = true;

    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket?.emit("join", user.id);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialised.current = false;
    };
  }, [isLoggedIn, user?.id]);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
