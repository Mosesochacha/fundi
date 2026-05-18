import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin" | "moderator";
  status: "active" | "inactive" | "suspended";
  emailVerified: boolean;
  isOnboarded: boolean;
  isActive: boolean;
}

export interface AuthProfile {
  id: string;
  username: string;
  fullName: string;
  profession: string;
  location: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
}

interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  accessToken: string | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  accessToken: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; profile: AuthProfile | null; accessToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      if (action.payload.accessToken !== undefined) {
        state.accessToken = action.payload.accessToken;
      }
      state.isLoggedIn = true;
    },
    logOut: (state) => {
      state.user = null;
      state.profile = null;
      state.accessToken = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;
