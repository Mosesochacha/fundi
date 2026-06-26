import type { AdminMutateReq } from "./service";

const patch = (url: string, body?: unknown): AdminMutateReq => ({
  method: "patch",
  url,
  body,
});
const post = (url: string, body?: unknown): AdminMutateReq => ({
  method: "post",
  url,
  body,
});
const del = (url: string): AdminMutateReq => ({ method: "delete", url });

export const adminEndpoints = {
  suspendUser: (id: string, body?: { days?: number; reason?: string }) =>
    patch(`/admin/users/${id}/suspend`, body),
  unsuspendUser: (id: string) => patch(`/admin/users/${id}/unsuspend`),
  banUser: (id: string, body?: { reason?: string }) =>
    patch(`/admin/users/${id}/ban`, body),
  deleteUser: (id: string) => del(`/admin/users/${id}`),

  verifyWorker: (id: string) => patch(`/admin/workers/${id}/verify`),
  rejectWorker: (id: string, reason?: string) =>
    patch(`/admin/workers/${id}/reject-verification`, { reason }),
  suspendWorker: (id: string, body?: { reason?: string }) =>
    patch(`/admin/workers/${id}/suspend`, body),

  suspendEmployer: (id: string, body?: { reason?: string }) =>
    patch(`/admin/employers/${id}/suspend`, body),
  unsuspendEmployer: (id: string) => patch(`/admin/employers/${id}/unsuspend`),

  cancelJob: (id: string) => patch(`/admin/jobs/${id}/cancel`),
  flagJob: (id: string, note?: string) =>
    patch(`/admin/jobs/${id}/flag`, { note }),

  hideReview: (id: string) => patch(`/admin/reviews/${id}/hide`),
  keepReview: (id: string) => patch(`/admin/reviews/${id}/keep`),
  removeReview: (id: string) => del(`/admin/reviews/${id}`),
  warnReviewer: (id: string, reason?: string) =>
    post(`/admin/reviews/${id}/warn`, { reason }),

  resolveReport: (
    id: string,
    body: {
      action: string;
      resolution?: string;
      notifyReporter?: boolean;
      status?: string;
    },
  ) => patch(`/admin/reports/${id}/resolve`, body),
  addReportNote: (id: string, text: string) =>
    post(`/admin/reports/${id}/notes`, { text }),

  markPayoutPaid: (id: string) => patch(`/admin/payouts/${id}/paid`),
  rejectPayout: (id: string) => patch(`/admin/payouts/${id}/reject`),
  processAllPayouts: () => post(`/admin/payouts/process-all`),

  updateSettings: (body: unknown) => patch(`/admin/settings`, body),
  updateEmailTemplate: (
    id: string,
    body: { subject?: string; body?: string; name?: string },
  ) => patch(`/admin/settings/email-templates/${id}`, body),
};
