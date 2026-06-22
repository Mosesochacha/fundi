import client from "@/lib/axios";

export const profileService = {
  /** Public profile by id or username. */
  getById: (id: string) => client.get(`/worker/${id}/profile`),
  /** Authenticated user's own worker profile. */
  getMine: () => client.get("/worker/me/profile"),

  updateAbout: (data: { about: string }) =>
    client.patch("/worker/profile/about", data),
  updateServices: (data: { services: string[] }) =>
    client.patch("/worker/profile/services", data),
  updateRate: (data: { dailyRate: number }) =>
    client.patch("/worker/profile/rate", data),
  updateServiceArea: (data: { areas: string[] }) =>
    client.patch("/worker/profile/service-area", data),
};
