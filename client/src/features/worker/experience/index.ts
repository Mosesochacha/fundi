import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { ExperienceItem } from "../profile/types/profile.types";

export interface ExperienceInput {
  title: string;
  company?: string;
  startYear?: number;
  endYear?: number | null;
  description?: string;
}

export const experienceService = {
  add: (data: ExperienceInput) =>
    client.post("/worker/profile/experience", data),
  update: (id: string, data: Partial<ExperienceInput>) =>
    client.patch(`/worker/profile/experience/${id}`, data),
  remove: (id: string) => client.delete(`/worker/profile/experience/${id}`),
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["worker", "profile"] });

export function useAddExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExperienceInput) => experienceService.add(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ExperienceInput & { id: string }) =>
      experienceService.update(id, data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => experienceService.remove(id),
    onSuccess: () => invalidate(qc),
  });
}

export type { ExperienceItem };
