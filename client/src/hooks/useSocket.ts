"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

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

    refCount += 1;
    let active = true;

    // socket.io-client is imported lazily so it stays out of the shared
    // bundle; useSocket itself gets pulled into eager chunks via next-auth.
    (async () => {
      if (!socket) {
        const { io } = await import("socket.io-client");
        // Re-check: another mount may have connected while we awaited, or
        // every mount may have unmounted (refCount drained) during the await.
        if (!socket) {
          if (refCount <= 0) return;
          socket = io(SOCKET_URL, {
            transports: ["websocket"],
            withCredentials: true,
            auth: { token: accessToken },
          });
          socket.on("connect", () => socket?.emit("join", userId));
        }
      }
      if (active) setCurrent(socket);
    })();

    return () => {
      active = false;
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
