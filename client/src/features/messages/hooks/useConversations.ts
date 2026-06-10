import { useQuery } from "@tanstack/react-query";
import { messagesService } from "../services/messages.service";
import type { Conversation } from "../types";

export function useConversations() {
  return useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => messagesService.getConversations(),
    select: (res) => res.data.data as Conversation[],
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
