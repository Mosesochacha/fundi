import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import type {
  EducationItem,
  EducationType,
} from "../profile/types/profile.types";

export interface EducationInput {
  type?: EducationType;
  name: string;
  institution?: string;
  startYear?: number;
  endYear?: number;
}

export const educationService = {
  add: (data: EducationInput) => client.post("/worker/profile/education", data),
  remove: (id: string) => client.delete(`/worker/profile/education/${id}`),
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["worker", "profile"] });

export function useAddEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EducationInput) => educationService.add(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => educationService.remove(id),
    onSuccess: () => invalidate(qc),
  });
}

export type { EducationItem };
