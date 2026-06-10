import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  messagesService,
  type SendMessageInput,
} from "../services/messages.service";

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageInput) => messagesService.send(data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
      if (vars.conversationId) {
        qc.invalidateQueries({
          queryKey: ["messages", "conversation", vars.conversationId],
        });
      }
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      messagesService.markRead(conversationId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["messages", "conversations"] }),
  });
}
