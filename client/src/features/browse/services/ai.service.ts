import client from "@/lib/axios";

export interface FindFundiResponse {
  answer: string;
}

/** Public "Ask AI / find a fundi" helper - no auth required. */
export const browseAiService = {
  findFundi: (query: string) => client.post("/ai/find-fundi", { query }),
};
