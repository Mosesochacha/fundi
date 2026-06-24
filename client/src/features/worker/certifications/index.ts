import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { CertificationItem } from "../profile/types/profile.types";

export interface CertificationInput {
  name: string;
  issuingBody?: string;
  yearIssued?: number;
  expiryYear?: number;
  documentUrl?: string;
}

export const certificationsService = {
  add: (data: CertificationInput) =>
    client.post("/worker/profile/certifications", data),
  remove: (id: string) => client.delete(`/worker/profile/certifications/${id}`),
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["worker", "profile"] });

export function useAddCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CertificationInput) => certificationsService.add(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => certificationsService.remove(id),
    onSuccess: () => invalidate(qc),
  });
}

export type { CertificationItem };
