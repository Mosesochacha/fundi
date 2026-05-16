"use client";

import { useSocket } from "@/hooks/useSocket";

export default function SocketInit() {
  useSocket();
  return null;
}
