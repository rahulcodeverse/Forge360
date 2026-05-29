'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Bell, LogOut, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AppHeader() {
  const t = useTranslations('common');
  const clearSession = useAuthStore((state) => state.clearSession);

  function handleLogout() {
    clearSession();
    const locale = document.documentElement.lang || 'en-US';
    window.location.href = `/${locale}/login`;
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground w-72">
        <Search className="h-4 w-4" />
        <span>{t('search')}...</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-full p-2 hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full p-2 transition-colors hover:bg-accent"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>

        {/* User avatar */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            U
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium leading-none">User</p>
            <p className="text-xs text-muted-foreground">employee</p>
          </div>
        </button>
      </div>
    </header>
  );
}
