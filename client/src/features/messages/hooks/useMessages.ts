import { useQuery } from "@tanstack/react-query";
import { messagesService } from "../services/messages.service";
import type { Message } from "../types";

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", "conversation", conversationId],
    queryFn: () => messagesService.getMessages(conversationId as string),
    enabled: !!conversationId,
    select: (res) => res.data.data as Message[],
    staleTime: 1000 * 10,
  });
}
