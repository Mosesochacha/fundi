import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

interface FeedState {
  postType:   string;
  dateRange:  string;
  profession: string;
  location:   string;
}

const initialState: FeedState = {
  postType:   "all",
  dateRange:  "all",
  profession: "all",
  location:   "",
};

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    setPostType:   (state, action: PayloadAction<string>) => { state.postType   = action.payload; },
    setDateRange:  (state, action: PayloadAction<string>) => { state.dateRange  = action.payload; },
    setProfession: (state, action: PayloadAction<string>) => { state.profession = action.payload; },
    setLocation:   (state, action: PayloadAction<string>) => { state.location   = action.payload; },
    clearFilters:  (state) => {
      state.postType   = "all";
      state.dateRange  = "all";
      state.profession = "all";
      state.location   = "";
    },
  },
});

export const { setPostType, setDateRange, setProfession, setLocation, clearFilters } = feedSlice.actions;

export const selectHasActiveFilters = (s: RootState) =>
  s.feed.postType !== "all" ||
  s.feed.dateRange !== "all" ||
  s.feed.profession !== "all" ||
  s.feed.location !== "";

export default feedSlice.reducer;
