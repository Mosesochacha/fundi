import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut, setCredentials } from "./authSlice";
import type { RootState } from "./index";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (args, api, extra) => {
  let result = await baseQuery(args, api, extra);
  if (result.error?.status === 401 || result.error?.status === 403) {
    // Attempt silent refresh using the lot_r1 httpOnly cookie
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extra
    );
    if (refreshResult.data) {
      const newToken = (refreshResult.data as { data: { accessToken: string } }).data.accessToken;
      const { user, profile } = (api.getState() as RootState).auth;
      api.dispatch(setCredentials({ user: user!, profile, accessToken: newToken }));
      result = await baseQuery(args, api, extra);
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Profile", "Feed", "Post", "Comments", "Sessions", "Settings"],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<ApiResponse, RegisterInput>({
      query: (data) => ({ url: "/auth/register", method: "POST", body: data }),
    }),
    login: builder.mutation<ApiResponse, { email: string; password: string }>({
      query: (data) => ({ url: "/auth/login", method: "POST", body: data }),
    }),
    logout: builder.mutation<ApiResponse, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    getMe: builder.query<ApiResponse, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    verifyEmail: builder.mutation<ApiResponse, { email: string; code: string }>({
      query: (data) => ({ url: "/auth/verify-email", method: "POST", body: data }),
    }),
    resendVerification: builder.mutation<ApiResponse, { email: string }>({
      query: (data) => ({ url: "/auth/resend-verification", method: "POST", body: data }),
    }),
    forgotPassword: builder.mutation<ApiResponse, { email: string }>({
      query: (data) => ({ url: "/auth/forgot-password", method: "POST", body: data }),
    }),
    resetPassword: builder.mutation<ApiResponse, { token: string; newPassword: string }>({
      query: (data) => ({ url: "/auth/reset-password", method: "POST", body: data }),
    }),

    // Feed
    getFeed: builder.query<ApiResponse, { type?: string; page?: number; limit?: number }>({
      query: ({ type = "all", page = 1, limit = 10 } = {}) =>
        `/feed?type=${type}&page=${page}&limit=${limit}`,
      providesTags: ["Feed"],
    }),

    // Posts
    getPost: builder.query<ApiResponse, string>({
      query: (id) => `/posts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Post", id }],
    }),
    createPost: builder.mutation<ApiResponse, CreatePostInput>({
      query: (data) => ({ url: "/posts", method: "POST", body: data }),
      invalidatesTags: ["Feed"],
    }),
    deletePost: builder.mutation<ApiResponse, string>({
      query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Feed"],
    }),
    toggleLike: builder.mutation<ApiResponse, string>({
      query: (id) => ({ url: `/posts/${id}/like`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Post", id }, "Feed"],
    }),
    getComments: builder.query<ApiResponse, string>({
      query: (postId) => `/posts/${postId}/comments`,
      providesTags: (_r, _e, postId) => [{ type: "Comments", id: postId }],
    }),
    addComment: builder.mutation<ApiResponse, { postId: string; content: string }>({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: "Comments", id: postId }],
    }),
    polishPost: builder.mutation<ApiResponse, { roughText: string; profession?: string; postType?: string }>({
      query: (data) => ({ url: "/ai/polish-post", method: "POST", body: data }),
    }),

    // Profiles
    getProfile: builder.query<ApiResponse, string>({
      query: (username) => `/profiles/${username}`,
      providesTags: (_r, _e, username) => [{ type: "Profile", id: username }],
    }),
    getProfilePosts: builder.query<ApiResponse, { username: string; page?: number }>({
      query: ({ username, page = 1 }) => `/profiles/${username}/posts?page=${page}`,
      providesTags: (_r, _e, { username }) => [{ type: "Feed", id: `profile-${username}` }],
    }),
    toggleFollow: builder.mutation<ApiResponse, string>({
      query: (profileId) => ({ url: `/follow/${profileId}`, method: "POST" }),
      invalidatesTags: (_r, _e, profileId) => [{ type: "Profile", id: profileId }, "Feed"],
    }),

    // Settings — profile
    updateProfile: builder.mutation<ApiResponse, UpdateProfileInput>({
      query: (data) => ({ url: "/profile", method: "PATCH", body: data }),
      invalidatesTags: ["Profile", "User"],
    }),
    checkUsername: builder.query<ApiResponse, string>({
      query: (u) => `/profiles/check-username?u=${encodeURIComponent(u)}`,
    }),
    checkUsernamePublic: builder.query<ApiResponse, string>({
      query: (u) => `/public/check-username?u=${encodeURIComponent(u)}`,
    }),

    // Setup / onboarding
    generateProfile: builder.mutation<ApiResponse, GenerateProfileInput>({
      query: (data) => ({ url: "/generate/profile", method: "POST", body: data }),
    }),
    publishProfile: builder.mutation<ApiResponse, void>({
      query: () => ({ url: "/profile/publish", method: "POST" }),
      invalidatesTags: ["User", "Profile"],
    }),

    // Settings — notifications
    getNotifications: builder.query<ApiResponse, void>({
      query: () => "/settings/notifications",
      providesTags: [{ type: "Settings", id: "notifications" }],
    }),
    updateNotifications: builder.mutation<ApiResponse, Record<string, boolean>>({
      query: (data) => ({ url: "/settings/notifications", method: "PATCH", body: data }),
      invalidatesTags: [{ type: "Settings", id: "notifications" }],
    }),

    // Settings — privacy
    getPrivacy: builder.query<ApiResponse, void>({
      query: () => "/settings/privacy",
      providesTags: [{ type: "Settings", id: "privacy" }],
    }),
    updatePrivacy: builder.mutation<ApiResponse, Record<string, boolean>>({
      query: (data) => ({ url: "/settings/privacy", method: "PATCH", body: data }),
      invalidatesTags: [{ type: "Settings", id: "privacy" }],
    }),

    // Settings — preferences
    getPreferences: builder.query<ApiResponse, void>({
      query: () => "/settings/preferences",
      providesTags: [{ type: "Settings", id: "preferences" }],
    }),
    updatePreferences: builder.mutation<ApiResponse, Record<string, string>>({
      query: (data) => ({ url: "/settings/preferences", method: "PATCH", body: data }),
      invalidatesTags: [{ type: "Settings", id: "preferences" }],
    }),

    // Auth — account management
    changePassword: builder.mutation<ApiResponse, { currentPassword: string; newPassword: string }>({
      query: (data) => ({ url: "/auth/change-password", method: "PUT", body: data }),
    }),
    changeEmail: builder.mutation<ApiResponse, { newEmail: string; currentPassword: string }>({
      query: (data) => ({ url: "/auth/change-email", method: "PUT", body: data }),
    }),
    deleteAccount: builder.mutation<ApiResponse, { confirmation: string }>({
      query: (data) => ({ url: "/auth/account", method: "DELETE", body: data }),
    }),

    // Sessions
    getSessions: builder.query<ApiResponse, void>({
      query: () => "/auth/sessions",
      providesTags: ["Sessions"],
    }),
    revokeSession: builder.mutation<ApiResponse, string>({
      query: (id) => ({ url: `/auth/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sessions"],
    }),
    revokeAllSessions: builder.mutation<ApiResponse, void>({
      query: () => ({ url: "/auth/sessions/all", method: "DELETE" }),
      invalidatesTags: ["Sessions"],
    }),
    getLoginHistory: builder.query<ApiResponse, number | void>({
      query: (limit = 5) => `/auth/login-history?limit=${limit}`,
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetFeedQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  usePolishPostMutation,
  useGetProfileQuery,
  useGetProfilePostsQuery,
  useToggleFollowMutation,
  useUpdateProfileMutation,
  useCheckUsernameQuery,
  useCheckUsernamePublicQuery,
  useGenerateProfileMutation,
  usePublishProfileMutation,
  useGetNotificationsQuery,
  useUpdateNotificationsMutation,
  useGetPrivacyQuery,
  useUpdatePrivacyMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useDeleteAccountMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsMutation,
  useGetLoginHistoryQuery,
} = apiSlice;

// Types
interface ApiResponse { success: boolean; data: unknown; message?: string }
interface RegisterInput { email: string; password: string; username: string; firstName: string; lastName: string; profession: string; location: string; termsAccepted: boolean; ageConfirmed: boolean }
interface CreatePostInput { content: string; postType: string; images?: string[] }
interface UpdateProfileInput {
  fullName?: string; username?: string; profession?: string; location?: string;
  bio?: string; tagline?: string; phone?: string; whatsapp?: string;
  yearsExperience?: number; services?: string[]; theme?: string;
  displayNameFormat?: string; profileLayout?: string;
}
interface GenerateProfileInput {
  fullName?: string; profession: string; location?: string;
  yearsExperience?: number; differentiator?: string;
}
