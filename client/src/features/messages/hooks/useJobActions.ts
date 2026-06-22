import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type CreateJobInput,
  type JobAction,
  jobsService,
} from "../services/jobs.service";

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobInput) => jobsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

/** Accept / decline / complete / cancel a job request from the chat banner. */
export function useJobAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: JobAction }) =>
      jobsService[action](id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}
