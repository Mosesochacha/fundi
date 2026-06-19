import { useMutation } from "@tanstack/react-query";
import {
  browseAiService,
  type FindFundiResponse,
} from "../services/ai.service";

/**
 * Calls the public /ai/find-fundi endpoint. Returns the assistant's plain-text
 * recommendation as `data`; consumers read `data` / `isPending` / `error`.
 */
export function useFindFundi() {
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await browseAiService.findFundi(query);
      return (res.data.data as FindFundiResponse).answer;
    },
  });
}
