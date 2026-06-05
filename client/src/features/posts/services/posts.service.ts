import client from "@/lib/axios";

export interface CreatePostInput {
  content: string;
  postType: string;
  images?: string[];
  scheduledAt?: string;
}

export interface AddCommentInput {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export const postsService = {
  getPost: (id: string) => client.get(`/posts/${id}`),
  getPostBySlug: (slug: string) => client.get(`/posts/by-slug/${slug}`),
  createPost: (data: CreatePostInput) => client.post("/posts", data),
  deletePost: (id: string) => client.delete(`/posts/${id}`),
  toggleLike: (id: string) => client.post(`/posts/${id}/like`),

  getComments: (postId: string) => client.get(`/posts/${postId}/comments`),
  addComment: ({ postId, content, parentCommentId }: AddCommentInput) =>
    client.post(`/posts/${postId}/comments`, {
      content,
      ...(parentCommentId ? { parentCommentId } : {}),
    }),
  toggleCommentLike: ({
    postId,
    commentId,
  }: {
    postId: string;
    commentId: string;
  }) => client.post(`/posts/${postId}/comments/${commentId}/like`),

  polishPost: (data: {
    roughText: string;
    profession?: string;
    postType?: string;
  }) => client.post("/ai/polish-post", data),
};
