'use client';

import {
  BarChart3,
  BookOpen,
  BriefcaseIcon,
  Calendar,
  ClipboardCheck,
  Clock,
  DollarSign,
  Home,
  Laptop,
  ReceiptText,
  Settings,
  Target,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@hrms/ui';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: Home },
  { key: 'employees', href: '/employees', icon: Users },
  { key: 'onboarding', href: '/onboarding', icon: ClipboardCheck },
  { key: 'attendance', href: '/attendance', icon: Clock },
  { key: 'leave', href: '/leave', icon: Calendar },
  { key: 'payroll', href: '/payroll', icon: DollarSign },
  { key: 'expenses', href: '/expenses', icon: ReceiptText },
  { key: 'assets', href: '/assets', icon: Laptop },
  { key: 'performance', href: '/performance', icon: Target },
  { key: 'recruitment', href: '/recruitment', icon: BriefcaseIcon },
  { key: 'learning', href: '/learning', icon: BookOpen },
  { key: 'reports', href: '/reports', icon: BarChart3 },
  { key: 'settings', href: '/settings', icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <span className="text-xl font-bold text-white">HRMS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ key, href, icon: Icon }) => {
            const isActive =
              pathname.includes(href) && href !== '/dashboard'
                ? true
                : pathname === href || (href === '/dashboard' && pathname.endsWith('/dashboard'));

            return (
              <li key={key}>
                <Link
                  href={`/en-US${href}`}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
