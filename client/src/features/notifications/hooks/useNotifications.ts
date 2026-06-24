import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";
import type { NotificationsResult } from "../types";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.list(),
    select: (res) => res.data.data as NotificationsResult,
    enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
