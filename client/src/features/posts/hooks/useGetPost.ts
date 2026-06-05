import { useQuery } from "@tanstack/react-query";
import { postsService } from "../services/posts.service";

export function useGetPost(id: string | undefined) {
  return useQuery({
    queryKey: ["posts", "byId", id],
    queryFn: () => postsService.getPost(id!),
    enabled: !!id,
    select: (res) => res.data.data,
  });
}

export function useGetPostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["posts", "bySlug", slug],
    queryFn: () => postsService.getPostBySlug(slug!),
    enabled: !!slug,
    select: (res) => res.data.data,
  });
}
