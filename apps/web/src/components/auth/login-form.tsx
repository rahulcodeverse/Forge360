'use client';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { loginSchema } from '@hrms/shared-types';

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations('auth');
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', tenantSlug: 'acme' },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{
        data: {
          requiresMfa: boolean;
          accessToken?: string;
          tenantId?: string;
        };
      }>('/auth/login', values);

      if (res.data.requiresMfa && !values.totpCode) {
        setStep('mfa');
        return;
      }

      if (res.data.accessToken && res.data.tenantId) {
        setSession(res.data.accessToken, res.data.tenantId);
        const locale = document.documentElement.lang || 'en-US';
        window.location.href = `/${locale}/dashboard`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step === 'credentials' && (
          <>
            <div className="space-y-2">
              <label htmlFor="tenantSlug" className="text-sm font-medium">
                Workspace
              </label>
              <input
                id="tenantSlug"
                type="text"
                autoComplete="organization"
                placeholder="e.g. acme"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('tenantSlug')}
              />
              {form.formState.errors.tenantSlug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.tenantSlug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
          </>
        )}

        {step === 'mfa' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('mfaDescription')}</p>
            <label htmlFor="totpCode" className="text-sm font-medium">
              {t('mfaCode')}
            </label>
            <input
              id="totpCode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="w-full rounded-md border px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              {...form.register('totpCode')}
            />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (t('loading' as never) ?? '...') : t('login')}
        </button>

        {step === 'credentials' && (
          <p className="text-center text-xs text-muted-foreground">
            <a href="/forgot-password" className="underline-offset-4 hover:underline">
              {t('forgotPassword')}
            </a>
          </p>
        )}
      </form>
    </div>
  );
}
