import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface StoreItem {
  id: string;
  name: string;
}

interface StoresState {
  map: Record<string, string>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  lastFetchedAt: number | null;
}

const CACHE_TTL_MS = 5 * 60_000; // 5 min — stores are static

const initialState: StoresState = {
  map: {},
  status: 'idle',
  lastFetchedAt: null,
};

export const fetchStores = createAsyncThunk<
  StoreItem[],
  { token: string; force?: boolean },
  { state: { stores: StoresState } }
>(
  'stores/fetch',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/stores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch stores');
    }
  },
  {
    condition: ({ force }, { getState }) => {
      if (force) return true;
      const { status, lastFetchedAt } = getState().stores;
      if (status === 'loading') return false;
      if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_TTL_MS) return false;
      return true;
    },
  }
);

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.map = Object.fromEntries(action.payload.map((s) => [s.id, s.name]));
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchStores.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default storesSlice.reducer;
