'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type StoreZoneSummary = {
  id: string;
  name: string;
  floor: number;
};

type StoreCategorySummary = {
  id: string;
  name: string;
};

type StoreListItem = {
  id: string;
  name: string;
  description: string;
  floor: number;
  unit_number: string;
  zone?: StoreZoneSummary | null;
  category?: StoreCategorySummary | null;
};

export default function StoresPage() {
  const { getToken } = useAuth();
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading stores...');

  useEffect(() => {
    async function loadStores() {
      try {
        const token = await getToken();
        const res = await apiFetch('/api/v1/stores', token);
        if (!res.ok) {
          setMessage('Could not load stores.');
          setLoading(false);
          return;
        }

        const data = (await res.json()) as StoreListItem[];
        setStores(data);
        setMessage(data.length ? `Showing ${data.length} stores.` : 'No stores have been added yet.');
      } catch {
        setMessage('Could not load stores.');
      } finally {
        setLoading(false);
      }
    }

    void loadStores();
  }, [getToken]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-indigo-300/80">Store directory</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Stores</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            View the stores that are registered in the mall.
          </p>
        </div>
        <Link href="/dashboard" className="inline-flex w-fit items-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800">
          Back to overview
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
        {message}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-zinc-400">Loading...</div>
      ) : stores.length ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-2xl shadow-black/30 backdrop-blur">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Store</th>
                <th className="px-4 py-3 text-left font-medium">Floor</th>
                <th className="px-4 py-3 text-left font-medium">Unit</th>
                <th className="px-4 py-3 text-left font-medium">Zone</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/60 text-zinc-200">
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{store.name}</div>
                    <div className="text-xs text-zinc-500">{store.description || 'No description'}</div>
                  </td>
                  <td className="px-4 py-3">{store.floor}</td>
                  <td className="px-4 py-3">{store.unit_number}</td>
                  <td className="px-4 py-3">{store.zone ? `${store.zone.name} (F${store.zone.floor})` : '—'}</td>
                  <td className="px-4 py-3">{store.category?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
          No stores have been added yet.
        </div>
      )}
    </div>
  );
}