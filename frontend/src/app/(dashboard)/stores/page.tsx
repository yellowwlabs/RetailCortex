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
  admin_email?: string | null;
};

type ZoneListItem = {
  id: string;
  name: string;
  floor: number;
  capacity: number;
};

type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
};

type UserListItem = {
  id: string;
  email: string;
};

export default function StoresPage() {
  const { getToken } = useAuth();
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [zones, setZones] = useState<ZoneListItem[]>([]);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading stores...');
  const [showOnboardForm, setShowOnboardForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [floor, setFloor] = useState(0);
  const [unitNumber, setUnitNumber] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadStores() {
    try {
      const token = await getToken();
      const res = await apiFetch('/api/v1/stores', token);
      if (!res.ok) {
        setMessage('Could not load stores.');
        return;
      }
      const data = (await res.json()) as StoreListItem[];
      setStores(data);
      setMessage(data.length ? `Showing ${data.length} stores.` : 'No stores have been added yet.');
    } catch {
      setMessage('Could not load stores.');
    }
  }

  async function loadMetadata() {
    try {
      const token = await getToken();
      const [zonesRes, categoriesRes, usersRes] = await Promise.all([
        apiFetch('/api/v1/stores/zones', token),
        apiFetch('/api/v1/stores/categories', token),
        apiFetch('/api/v1/users', token),
      ]);

      if (zonesRes.ok) {
        const zonesData = (await zonesRes.json()) as ZoneListItem[];
        setZones(zonesData);
        if (zonesData.length) setSelectedZoneId(zonesData[0].id);
      }
      if (categoriesRes.ok) {
        const categoriesData = (await categoriesRes.json()) as CategoryListItem[];
        setCategories(categoriesData);
      }
      if (usersRes.ok) {
        const usersData = (await usersRes.json()) as UserListItem[];
        setUsers(usersData);
      }
    } catch (e) {
      console.error('Error loading metadata', e);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadStores(), loadMetadata()]);
      setLoading(false);
    }
    void init();
  }, [getToken]);

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !unitNumber || !selectedZoneId) {
      setFormError('Please fill in name, unit number, and select a zone.');
      return;
    }

    setFormError('');
    setFormBusy(true);

    try {
      const token = await getToken();
      const res = await apiFetch('/api/v1/stores', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          floor: Number(floor),
          unit_number: unitNumber,
          zone_id: selectedZoneId,
          category_id: selectedCategoryId || null,
          admin_email: adminEmail || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setFormError(errorData?.detail ?? 'Failed to onboard store.');
        setFormBusy(false);
        return;
      }

      // Success
      setName('');
      setDescription('');
      setFloor(0);
      setUnitNumber('');
      setAdminEmail('');
      setFormBusy(false);
      setShowOnboardForm(false);

      // Reload Stores
      setLoading(true);
      await loadStores();
      setLoading(false);
    } catch {
      setFormError('Connection error. Failed to onboard.');
      setFormBusy(false);
    }
  }

  async function handleUpdateZone(storeId: string, zoneId: string) {
    if (!zoneId) return;
    try {
      const token = await getToken();
      const res = await apiFetch(`/api/v1/stores/${storeId}/zone`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: zoneId }),
      });
      if (res.ok) {
        // Reload Stores
        await loadStores();
      } else {
        const errorData = await res.json().catch(() => null);
        console.error('Failed to update zone:', errorData?.detail);
      }
    } catch (e) {
      console.error('Error updating store zone', e);
    }
  }

  const totalStores = stores.length;
  const unassignedAdmins = stores.filter((s) => !s.admin_email).length;
  const adminsAssigned = totalStores - unassignedAdmins;
  const adminRate = totalStores > 0 ? Math.round((adminsAssigned / totalStores) * 100) : 0;
  const zonesAssigned = stores.filter((s) => s.zone).length;
  const zoneCoverage = totalStores > 0 ? Math.round((zonesAssigned / totalStores) * 100) : 0;
  const categoriesAssigned = stores.filter((s) => s.category).length;
  const categoryRate = totalStores > 0 ? Math.round((categoriesAssigned / totalStores) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8 py-6 animate-entrance">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">Executive Control Panel</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white tracking-tight sm:text-4xl font-serif">Onboard Tenant Stores</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 font-light leading-relaxed">
            Register and configure commercial tenant spaces, assign administrative roles, and map layouts across mall levels.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowOnboardForm(!showOnboardForm)}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(91,77,255,0.2)] hover:shadow-[0_0_25px_rgba(91,77,255,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {showOnboardForm ? 'Close Form' : 'Onboard New Store'}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Overview
          </Link>
        </div>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400 tracking-wider">Total Tenant Stores</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.5a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75h-35a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalStores}</span>
            <span className="text-xs text-zinc-500">registered</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400 tracking-wider">Admins Assigned</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.75A11.952 11.952 0 0112 2.707z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{adminsAssigned}</span>
            <span className="text-xs text-emerald-400 font-medium">({adminRate}%)</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400 tracking-wider">Layout Coverage</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/15">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{zoneCoverage}%</span>
            <span className="text-xs text-zinc-500">{zonesAssigned} in zones</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-zinc-400 tracking-wider">Categorization Rate</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/15">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.464 1.464 0 002.07 0l4.319-4.319a1.464 1.464 0 000-2.07l-9.581-9.581a2.25 2.25 0 00-1.591-.659zM6 7.5h.008v.008H6V7.5z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{categoryRate}%</span>
            <span className="text-xs text-zinc-500">{categoriesAssigned} categories</span>
          </div>
        </div>
      </section>

      {/* Onboard Form Card */}
      {showOnboardForm && (
        <form
          onSubmit={handleOnboard}
          className="rounded-2xl border border-white/10 bg-zinc-950/60 p-8 space-y-6 max-w-2xl mx-auto shadow-2xl backdrop-blur-xl animate-entrance"
        >
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white tracking-wide font-serif">Onboard New Space</h2>
            <p className="text-xs text-zinc-400 mt-1">Provide space specifications, layout anchors, and assign the tenant admin.</p>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex gap-2.5 items-center">
                <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Store Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nike Flagship Store"
                className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Store Administrator</label>
              <div className="relative">
                <select
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">Unassigned / No Active Admin</option>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <option key={user.id} value={user.email} className="bg-zinc-900">
                        {user.email}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled className="bg-zinc-900">No users available in DB</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about product line, merchandising focus, or lease guidelines..."
                className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300 min-h-24 resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Floor Level</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Unit Number</label>
              <input
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. L2-204"
                className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Layout Zone</label>
              <div className="relative">
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300 appearance-none cursor-pointer"
                >
                  {!zones.length && <option value="" className="bg-zinc-900">No zones added yet</option>}
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} className="bg-zinc-900">
                      {z.name} (Floor {z.floor})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Product Category</label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">General Retail</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={formBusy || !zones.length}
            className="w-full mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(91,77,255,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {formBusy ? 'Registering Store...' : 'Complete Onboarding'}
          </button>
        </form>
      )}

      {/* Message Info Box */}
      <div className="rounded-xl border border-zinc-900/50 bg-zinc-900/10 p-4 text-xs text-zinc-500 font-mono flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
        </span>
        <span>Status Console: {message}</span>
      </div>

      {/* Portfolio Table Grid */}
      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-zinc-950/20 p-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
          <span>Synchronizing active commercial records...</span>
        </div>
      ) : stores.length ? (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/30 shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-900 text-sm">
              <thead className="bg-zinc-950/60 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left">Store details</th>
                  <th className="px-6 py-4 text-left">Floor</th>
                  <th className="px-6 py-4 text-left">Unit</th>
                  <th className="px-6 py-4 text-left">Zone assignment</th>
                  <th className="px-6 py-4 text-left">Retail Type</th>
                  <th className="px-6 py-4 text-left">Store Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/30 bg-zinc-950/10 text-zinc-300">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-white/[0.02] hover:scale-[1.002] transition-all duration-300">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{store.name}</div>
                      <div className="text-xs text-zinc-500 font-light mt-1 max-w-xs truncate">
                        {store.description || 'No description provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-mono font-medium text-zinc-400 border border-zinc-800">
                        L{store.floor}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-zinc-400 font-semibold">{store.unit_number || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {store.unit_number === '' ? (
                        <span className="text-zinc-500 italic">Imported Catalog</span>
                      ) : (
                        <div className="relative inline-block w-full min-w-36 max-w-44">
                          <select
                            value={store.zone?.id ?? ''}
                            onChange={(e) => handleUpdateZone(store.id, e.target.value)}
                            className="w-full text-xs rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-zinc-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-zinc-950">No Zone Assigned</option>
                            {zones.map((z) => (
                              <option key={z.id} value={z.id} className="bg-zinc-950">
                                {z.name} (L{z.floor})
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {store.category ? (
                        <span className="inline-flex items-center rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-400 tracking-wide">
                          {store.category.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-500 border border-zinc-800">
                          General Retail
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {store.admin_email ? (
                        <span className="inline-flex items-center gap-1.5 text-indigo-400 font-semibold font-mono">
                          <svg className="w-3 h-3 text-indigo-400/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.75A11.952 11.952 0 0112 2.707z" />
                          </svg>
                          {store.admin_email}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-zinc-600 font-mono">
                          <svg className="w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-zinc-950/20 p-12 text-center text-zinc-500 font-light flex flex-col items-center gap-3">
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.5a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
          </svg>
          <span className="text-sm">No registered stores found. Configure a zone and onboard a new tenant above.</span>
        </div>
      )}
    </div>
  );
}
