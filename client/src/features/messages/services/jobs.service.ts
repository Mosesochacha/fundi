import client from "@/lib/axios";

export interface CreateJobInput {
  workerId: string;
  title: string;
  location: string;
  description?: string;
  scheduledAt?: string;
}

export type JobAction = "accept" | "decline" | "complete" | "cancel";

export const jobsService = {
  create: (data: CreateJobInput) => client.post("/jobs", data),
  get: (id: string) => client.get(`/jobs/${id}`),
  accept: (id: string) => client.post(`/jobs/${id}/accept`),
  decline: (id: string) => client.post(`/jobs/${id}/decline`),
  complete: (id: string) => client.post(`/jobs/${id}/complete`),
  cancel: (id: string) => client.post(`/jobs/${id}/cancel`),
};
