import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsService, type CreatePostInput } from "../services/posts.service";

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) => postsService.createPost(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postsService.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postsService.toggleLike(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["posts", "byId", id] });
    },
  });
}

export function usePolishPost() {
  return useMutation({
    mutationFn: (data: {
      roughText: string;
      profession?: string;
      postType?: string;
    }) => postsService.polishPost(data),
  });
}
