import client from "@/lib/axios";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  accountType: "employer" | "worker";
  location: string;
  trade?: string;
  interestedTrades?: string[];
  dailyRate?: number;
  /** Preferred display currency (ISO 4217 code, e.g. "USD"). */
  currency?: string;
  agreedToTerms: boolean;
}

export const authService = {
  register: (data: RegisterInput) => client.post("/auth/register", data),
  me: () => client.get("/auth/me"),
  logout: () => client.post("/auth/logout"),

  pendingVerification: () => client.get("/auth/pending-verification"),
  startVerification: (data: { identifier: string }) =>
    client.post("/auth/start-verification", data),
  verifyEmail: (data: { code: string }) =>
    client.post("/auth/verify-email", data),
  resendVerification: () => client.post("/auth/resend-verification"),

  forgotPassword: (data: { identifier: string }) =>
    client.post("/auth/forgot-password", data),
  resendOtp: (data: { identifier: string }) =>
    client.post("/auth/resend-otp", data),
  verifyOtp: (data: { identifier: string; otp: string }) =>
    client.post("/auth/verify-otp", data),
  resetPassword: (data: {
    newPassword: string;
    identifier?: string;
    otp?: string;
    token?: string;
  }) => client.post("/auth/reset-password", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.put("/auth/change-password", data),
  changeEmail: (data: { newEmail: string; currentPassword: string }) =>
    client.put("/auth/change-email", data),
  deleteAccount: (data: { confirmation: string }) =>
    client.delete("/auth/account", { data }),

  getSessions: () => client.get("/auth/sessions"),
  revokeSession: (id: string) => client.delete(`/auth/sessions/${id}`),
  revokeAllSessions: () => client.delete("/auth/sessions/all"),
  getLoginHistory: (limit = 5) =>
    client.get(`/auth/login-history?limit=${limit}`),
};
