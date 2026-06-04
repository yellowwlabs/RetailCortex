'use client';

import { UserButton, useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useActiveRole, UserRole } from '@/lib/auth-sim';
import { apiFetch } from '@/lib/api';
import {
  LayoutDashboard,
  Package,
  Store,
  BarChart2,
  FileText,
  Settings,
  Bell,
  HelpCircle,
  Search,
  Plus,
  Download,
  Map,
  ChevronRight,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, changeRole, isLoaded } = useActiveRole();
  const { user } = useUser();
  const { getToken } = useAuth();
  const pathname = usePathname();
  const [localRole, setLocalRole] = useState<UserRole>('super_admin');

  // Verify DB role vs Clerk metadata
  useEffect(() => {
    async function verifyAndSyncRole() {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await apiFetch('/api/v1/users/me', token);
        if (res.ok) {
          const meData = await res.json();
          const dbRole = meData.role;
          const effectiveClerkRole = user?.publicMetadata?.role || 'user';
          if (dbRole && effectiveClerkRole !== dbRole) {
            const lastSync = sessionStorage.getItem('rc_last_role_sync');
            const now = Date.now();
            if (!lastSync || now - parseInt(lastSync, 10) > 10000) {
              sessionStorage.setItem('rc_last_role_sync', now.toString());
              await user?.reload();
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error('Failed to verify and sync user role:', err);
      }
    }
    if (isLoaded && user) verifyAndSyncRole();
  }, [getToken, isLoaded, user]);

  useEffect(() => { setLocalRole(role); }, [role]);

  useEffect(() => {
    const handleRoleChange = () => {
      const saved = localStorage.getItem('rc_simulated_role') as UserRole | null;
      if (saved) setLocalRole(saved);
    };
    window.addEventListener('rc-role-change', handleRoleChange);
    return () => window.removeEventListener('rc-role-change', handleRoleChange);
  }, []);

  const isActive = (href: string) => pathname === href;

  const navItem = (href: string, Icon: React.ElementType, label: string) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group ${
          active
            ? 'bg-[#0a1a0a] text-[#00e87a] border border-[#00e87a]/20'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon
          size={16}
          className={`shrink-0 transition-colors ${active ? 'text-[#00e87a]' : 'text-zinc-500 group-hover:text-zinc-300'}`}
        />
        <span>{label}</span>
        {active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e87a] shadow-[0_0_6px_#00e87a]" />
        )}
      </Link>
    );
  };

  const currentPageTitle = () => {
    if (isActive('/dashboard')) return 'Store Manager';
    const last = pathname.split('/').pop();
    return last ? last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans antialiased">

      {/* ── Sidebar ── */}
      <aside className="w-56 flex flex-col shrink-0 border-r border-zinc-900 bg-black">

        {/* Branding */}
        <div className="px-5 pt-6 pb-5 border-b border-zinc-900">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#00e87a]/10 border border-[#00e87a]/30">
              <span className="text-[10px] font-bold text-[#00e87a] tracking-wider">RC</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white leading-none">RetailCortex</p>
              <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
                Global Operations
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navItem('/dashboard', LayoutDashboard, 'Dashboard')}
          {navItem('/dashboard/stores', Package, 'Inventory')}
          {navItem('/dashboard/zones', Store, 'Stores')}
          {navItem('/dashboard/categories', BarChart2, 'Analytics')}
          {navItem('/dashboard/campaigns', FileText, 'Reports')}
          {navItem('/dashboard/settings', Settings, 'Settings')}
        </nav>

        {/* User */}
        {isLoaded && user && (
          <div className="px-3 py-4 border-t border-zinc-900">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-zinc-950 border border-zinc-900">
              <UserButton showName={false} />
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.fullName || user.username || 'Admin'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* + New Store */}
        <div className="px-3 pb-4">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-300 hover:border-[#00e87a]/40 hover:text-[#00e87a] hover:bg-[#00e87a]/5 transition-all duration-150">
            <Plus size={13} />
            New Store
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between bg-black shrink-0">

          {/* Left: title + tab */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-base font-bold text-white leading-none">{currentPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-1 border-b-2 border-[#00e87a] pb-[14px] -mb-[1px]">
              <button className="text-xs font-semibold text-white px-1">Bulk actions</button>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <button className="text-xs text-zinc-400 hover:text-white transition-colors font-medium flex items-center gap-1.5">
              <Download size={13} />
              Export
            </button>

            {/* Search */}
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search stores, regions..."
                className="bg-zinc-900/60 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#00e87a]/40 focus:bg-zinc-900 transition-all w-48"
              />
            </div>

            {/* Bell */}
            <button className="relative p-1.5 rounded-md hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00e87a] rounded-full shadow-[0_0_4px_#00e87a]" />
            </button>

            {/* Help */}
            <button className="p-1.5 rounded-md hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white">
              <HelpCircle size={15} />
            </button>

            {/* Create Report */}
            <button className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-150">
              <FileText size={12} />
              Create Report
            </button>

            {/* Avatar */}
            {isLoaded && user && (
              <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white shrink-0 overflow-hidden">
                {user.imageUrl
                  ? <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
                  : (user.firstName?.[0] ?? 'U')}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
