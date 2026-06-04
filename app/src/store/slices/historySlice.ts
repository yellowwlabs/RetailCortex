import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type ActivityEventType = 'search' | 'feature_usage';

export interface ActivityItem {
  id: string;
  event_type: ActivityEventType;
  query: string | null;
  feature: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface RecordActivityPayload {
  event_type: ActivityEventType;
  query?: string;
  feature?: string;
  metadata?: Record<string, unknown>;
}

interface HistoryState {
  items: ActivityItem[];
  total: number;
  limit: number;
  offset: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchedAt: number | null;
}

const CACHE_TTL_MS = 60_000;

const initialState: HistoryState = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  status: 'idle',
  error: null,
  lastFetchedAt: null,
};

export const fetchHistory = createAsyncThunk<
  { items: ActivityItem[]; total: number; limit: number; offset: number },
  { token: string; limit?: number; offset?: number; eventType?: ActivityEventType; force?: boolean },
  { state: { history: HistoryState } }
>(
  'history/fetch',
  async ({ token, limit = 20, offset = 0, eventType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (eventType) params.set('event_type', eventType);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/me/history?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch history');
    }
  },
  {
    condition: ({ force }, { getState }) => {
      if (force) return true;
      const { status, lastFetchedAt } = getState().history;
      if (status === 'loading') return false;
      if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_TTL_MS) return false;
      return true;
    },
  }
);

export const recordActivity = createAsyncThunk<
  ActivityItem,
  { token: string } & RecordActivityPayload
>(
  'history/record',
  async ({ token, ...body }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/me/history`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to record activity');
    }
  }
);

export const clearHistory = createAsyncThunk<void, { token: string; eventType?: ActivityEventType }>(
  'history/clear',
  async ({ token, eventType }, { rejectWithValue }) => {
    try {
      const params = eventType ? `?event_type=${eventType}` : '';
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/me/history${params}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to clear history');
    }
  }
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    invalidateCache(state) {
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(recordActivity.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(clearHistory.fulfilled, (state, action) => {
        const eventType = (action.meta.arg as { eventType?: ActivityEventType }).eventType;
        if (eventType) {
          state.items = state.items.filter((i) => i.event_type !== eventType);
        } else {
          state.items = [];
          state.total = 0;
        }
        state.lastFetchedAt = null;
      });
  },
});

export const { invalidateCache } = historySlice.actions;
export default historySlice.reducer;
