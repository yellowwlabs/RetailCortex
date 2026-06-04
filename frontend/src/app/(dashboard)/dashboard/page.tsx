'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useActiveRole } from '@/lib/auth-sim';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  User,
  Map,
  Radio,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Store,
  BarChart3,
  ShoppingBag,
} from 'lucide-react';

type StoreSummary = {
  total_products: number;
  in_stock: number;
  out_of_stock: number;
  categories: number;
  low_stock: number;
};

const STORES = [
  {
    id: 1,
    name: 'Apex Kicks',
    tag: 'FOOTWEAR',
    tagColor: 'text-[#00e87a] border-[#00e87a]/30 bg-[#00e87a]/5',
    accentColor: '#00e87a',
    manager: 'J. Doe',
    region: 'US-West',
    status: 'online',
    icon: '👟',
    initials: null,
  },
  {
    id: 2,
    name: 'Everlane Studio',
    tag: 'CLOTHING',
    tagColor: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
    accentColor: '#3b82f6',
    manager: 'A. Smith',
    region: 'EU-North',
    status: 'offline',
    icon: null,
    initials: 'ES',
  },
  {
    id: 3,
    name: 'Heritage Goods',
    tag: 'LIFESTYLE',
    tagColor: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    accentColor: '#f59e0b',
    manager: 'R. Chen',
    region: 'APAC',
    status: 'online',
    icon: null,
    initials: 'HG',
  },
];

const ACTIVITY = [
  {
    id: 1,
    title: 'Store status updated',
    description: 'Apex Kicks went online.',
    time: '2 MINS AGO',
    active: true,
  },
  {
    id: 2,
    title: 'Report generated',
    description: 'Q3 Regional Sales downloaded.',
    time: '1 HR AGO',
    active: false,
  },
  {
    id: 3,
    title: 'Inventory alert',
    description: 'Low stock on 12 SKUs at Heritage Goods.',
    time: '3 HRS AGO',
    active: false,
  },
];

const STATS = [
  {
    label: 'TOTAL REVENUE',
    value: '$1.2M',
    delta: '+8.4% vs last month',
    positive: true,
    accentColor: '#00e87a',
  },
  {
    label: 'ACTIVE STORES',
    value: '48',
    delta: 'No change',
    positive: null,
    accentColor: '#6366f1',
  },
  {
    label: 'NETWORK GROWTH',
    value: '+12.4%',
    delta: '+2.1% vs last month',
    positive: true,
    accentColor: '#00e87a',
  },
  {
    label: 'AVG ORDER VALUE',
    value: '$85',
    delta: '+5.2% vs last month',
    positive: true,
    accentColor: '#3b82f6',
  },
];

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { role } = useActiveRole();
  const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [summary, setSummary] = useState<StoreSummary | null>(null);

  useEffect(() => {
    async function checkBackend() {
      try {
        const token = await getToken();
        if (!token) return;
        const [meRes, summaryRes] = await Promise.all([
          apiFetch('/api/v1/users/me', token),
          apiFetch('/api/v1/products/summary', token),
        ]);
        setApiStatus(meRes.ok && summaryRes.ok ? 'ok' : 'error');
        if (summaryRes.ok) setSummary(await summaryRes.json());
      } catch {
        setApiStatus('error');
      }
    }
    checkBackend();
  }, [getToken]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Stat Cards Row ── */}
      <div className="flex gap-0 border-b border-zinc-900 shrink-0">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex-1 px-6 py-5 border-r border-zinc-900 last:border-r-0 relative group cursor-default hover:bg-zinc-950/60 transition-colors duration-150`}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-1/4 h-1/2 w-[3px] rounded-r-full"
              style={{ background: stat.accentColor }}
            />
            <p className="text-[10px] font-semibold text-zinc-500 tracking-widest uppercase mb-2">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-white tracking-tight mb-1.5">
              {stat.value}
            </p>
            <div className="flex items-center gap-1">
              {stat.positive === true && (
                <TrendingUp size={11} style={{ color: stat.accentColor }} />
              )}
              {stat.positive === false && (
                <TrendingDown size={11} className="text-red-400" />
              )}
              {stat.positive === null && (
                <Minus size={11} className="text-zinc-500" />
              )}
              <span
                className="text-[11px] font-medium"
                style={{ color: stat.positive === true ? stat.accentColor : stat.positive === false ? '#f87171' : '#71717a' }}
              >
                {stat.delta}
              </span>
            </div>
          </div>
        ))}

        {/* Recent Activity panel header — shown on same row on wider screens */}
        <div className="w-64 px-6 py-5 shrink-0 hidden xl:block">
          <p className="text-sm font-bold text-white">Recent Activity</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Store Directory */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* API status */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'ok' ? 'bg-[#00e87a] shadow-[0_0_4px_#00e87a]' :
                apiStatus === 'error' ? 'bg-red-400' : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px] text-zinc-500">
              {apiStatus === 'ok' ? 'Connected to backend' :
               apiStatus === 'error' ? 'Backend unreachable' : 'Checking backend…'}
            </span>
          </div>

          {/* Store Directory header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Store Directory</h2>
            <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium">
              <Map size={12} />
              View Map
              <span className="text-[10px] text-zinc-600 font-mono ml-0.5">⊞</span>
            </button>
          </div>

          {/* Store Cards */}
          <div className="space-y-2">
            {STORES.map((store) => (
              <div
                key={store.id}
                className="relative flex items-center gap-4 px-4 py-3.5 rounded-lg border border-zinc-900 bg-zinc-950/30 hover:border-zinc-800 hover:bg-zinc-950/60 transition-all duration-150 group cursor-pointer"
              >
                {/* Left accent line */}
                <div
                  className="absolute left-0 top-1/4 h-1/2 w-[3px] rounded-r-full"
                  style={{ background: store.accentColor }}
                />

                {/* Store icon / avatar */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border"
                  style={{
                    background: `${store.accentColor}12`,
                    borderColor: `${store.accentColor}30`,
                    color: store.accentColor,
                  }}
                >
                  {store.icon ?? store.initials}
                </div>

                {/* Name & manager */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{store.name}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${store.tagColor}`}
                    >
                      {store.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <User size={10} className="text-zinc-600" />
                    <span className="text-[11px] text-zinc-500">{store.manager}</span>
                  </div>
                </div>

                {/* Region */}
                <div className="flex items-center gap-1 shrink-0">
                  <MapPin size={11} className="text-zinc-600" />
                  <span className="text-xs text-zinc-400">{store.region}</span>
                </div>

                {/* Status dot */}
                <div className="shrink-0">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      store.status === 'online'
                        ? 'bg-[#00e87a] shadow-[0_0_5px_#00e87a]'
                        : 'bg-zinc-600'
                    }`}
                  />
                </div>

                {/* Hover arrow */}
                <ChevronRight
                  size={14}
                  className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0"
                />
              </div>
            ))}
          </div>

          {/* Summary stats from backend */}
          {summary && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Products', value: summary.total_products, icon: ShoppingBag },
                { label: 'In Stock', value: summary.in_stock, icon: BarChart3 },
                { label: 'Out of Stock', value: summary.out_of_stock, icon: TrendingDown },
                { label: 'Categories', value: summary.categories, icon: Store },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 bg-zinc-950 border border-zinc-900 rounded-lg px-4 py-3 hover:border-zinc-800 transition-colors"
                >
                  <item.icon size={14} className="text-zinc-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    <p className="text-base font-bold text-white mt-0.5">{item.value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Store admin CTA */}
          {role === 'store_admin' && (
            <div className="mt-6 flex items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-xl px-6 py-4">
              <div className="w-10 h-10 rounded-lg bg-[#00e87a]/10 border border-[#00e87a]/20 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} className="text-[#00e87a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">CSV onboarding ready</p>
                <p className="text-xs text-zinc-500 mt-0.5">Upload a catalog to import products and populate the search index.</p>
              </div>
              <Link
                href="/dashboard/store"
                className="shrink-0 text-xs font-semibold text-[#00e87a] border border-[#00e87a]/30 bg-[#00e87a]/5 hover:bg-[#00e87a]/10 px-4 py-2 rounded-lg transition-colors"
              >
                Open Upload
              </Link>
            </div>
          )}
        </div>

        {/* Right: Recent Activity panel */}
        <div className="w-64 shrink-0 border-l border-zinc-900 flex flex-col">
          <div className="px-5 py-5 border-b border-zinc-900 xl:hidden">
            <p className="text-sm font-bold text-white">Recent Activity</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {ACTIVITY.map((item) => (
              <div key={item.id} className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 mt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      item.active
                        ? 'border-[#00e87a] bg-[#00e87a]/10'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >
                    {item.active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00e87a]" />
                    )}
                  </div>
                  {/* Connector */}
                  <div className="w-px flex-1 bg-zinc-900 mt-1 min-h-4" />
                </div>

                {/* Content */}
                <div className="pb-4 flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white leading-snug">{item.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{item.description}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={9} className="text-zinc-600" />
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono">{item.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-zinc-900">
            <button className="w-full text-xs font-semibold text-white hover:text-[#00e87a] transition-colors text-center">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
