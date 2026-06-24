import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";

export const availabilityService = {
  set: (data: { available: boolean }) =>
    client.patch("/worker/availability", data),
};

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { available: boolean }) => availabilityService.set(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worker", "profile"] }),
  });
}
