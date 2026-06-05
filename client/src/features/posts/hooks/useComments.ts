import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postsService, type AddCommentInput } from "../services/posts.service";

export function useGetComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["posts", "comments", postId],
    queryFn: () => postsService.getComments(postId!),
    enabled: !!postId,
    select: (res) => res.data.data as any[],
  });
}

export function useToggleCommentLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; commentId: string }) =>
      postsService.toggleCommentLike(vars),
    onSuccess: (_d, { postId }) =>
      qc.invalidateQueries({ queryKey: ["posts", "comments", postId] }),
  });
}

/** Adds a comment with an optimistic insert (ported from the old RTK flow). */
export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: AddCommentInput) => postsService.addComment(vars),
    onMutate: async ({ postId, content, parentCommentId }) => {
      const key = ["posts", "comments", postId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);

      // Optimistic author from the cached /auth/me response.
      const meRes = qc.getQueryData<any>(["auth", "me"]);
      const me = meRes?.data?.data?.profile;
      if (prev && me) {
        const optimistic = {
          id: `optimistic-${Math.random().toString(36).slice(2)}`,
          postId,
          content,
          parentCommentId: parentCommentId ?? null,
          likesCount: 0,
          likedByMe: false,
          createdAt: new Date().toISOString(),
          author: {
            id: me.id,
            fullName: me.fullName,
            avatarUrl: me.avatarUrl,
            username: me.username,
          },
          replies: [],
        };
        qc.setQueryData<any>(key, (old: any) => {
          if (!old) return old;
          const env = old.data;
          const list: any[] = [...(env.data ?? [])];
          if (parentCommentId) {
            const parent = list.find((c) => c.id === parentCommentId);
            if (parent) parent.replies = [...(parent.replies ?? []), optimistic];
          } else {
            list.push(optimistic);
          }
          return { ...old, data: { ...env, data: list } };
        });
      }
      return { prev, postId };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(["posts", "comments", ctx.postId], ctx.prev);
    },
    onSettled: (_d, _e, vars) =>
      qc.invalidateQueries({ queryKey: ["posts", "comments", vars.postId] }),
  });
}
