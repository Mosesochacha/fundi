import Typesense from "typesense";

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
      port: Number.parseInt(
        process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108",
        10,
      ),
      protocol: (process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http") as
        | "http"
        | "https",
    },
  ],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || "",
  connectionTimeoutSeconds: 3,
  numRetries: 1,
});

export async function instantSearchProfiles(q: string): Promise<unknown[]> {
  try {
    const results = await client
      .collections("profiles")
      .documents()
      .search({
        q: q || "*",
        query_by: "fullName,profession,location",
        filter_by: "isPublished:=true",
        per_page: 5,
      });
    return results.hits?.map((h: { document: unknown }) => h.document) ?? [];
  } catch {
    return [];
  }
}

export async function instantSearchPosts(q: string): Promise<unknown[]> {
  try {
    const results = await client
      .collections("posts")
      .documents()
      .search({
        q: q || "*",
        query_by: "content,authorName",
        filter_by: "status:=PUBLISHED",
        per_page: 5,
      });
    return results.hits?.map((h: { document: unknown }) => h.document) ?? [];
  } catch {
    return [];
  }
}
