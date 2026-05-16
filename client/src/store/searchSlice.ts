import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  query:          string;
  profileResults: any[];
  postResults:    any[];
  isLoading:      boolean;
  error:          string | null;
}

const initialState: SearchState = {
  query:          '',
  profileResults: [],
  postResults:    [],
  isLoading:      false,
  error:          null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setProfileResults(state, action: PayloadAction<any[]>) {
      state.profileResults = action.payload;
    },
    setPostResults(state, action: PayloadAction<any[]>) {
      state.postResults = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearSearch(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setQuery,
  setProfileResults,
  setPostResults,
  setLoading,
  setError,
  clearSearch,
} = searchSlice.actions;

export default searchSlice.reducer;
