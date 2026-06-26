import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { PortfolioItem } from "../profile/types/profile.types";

export interface AddPhotoInput {
  url?: string;
  caption: string;
  jobType?: string;
  isBefore?: boolean;
  afterPhotoId?: string;
}

export const portfolioService = {
  addPhoto: (data: AddPhotoInput) =>
    client.post("/worker/profile/photos", data),
  deletePhoto: (photoId: string) =>
    client.delete(`/worker/profile/photos/${photoId}`),
  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append("work", file);
    return client.post("/worker/profile/photos/upload", fd);
  },
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["worker", "profile"] });

export function useAddPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddPhotoInput) => portfolioService.addPhoto(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUploadPhoto() {
  return useMutation({
    mutationFn: (file: File) => portfolioService.uploadPhoto(file),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => portfolioService.deletePhoto(photoId),
    onSuccess: () => invalidate(qc),
  });
}

export type { PortfolioItem };
