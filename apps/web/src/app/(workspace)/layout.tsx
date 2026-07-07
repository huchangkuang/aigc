'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuthStore } from '@/stores/auth-store';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrateFromCookie = useAuthStore((s) => s.hydrateFromCookie);

  useEffect(() => {
    hydrateFromCookie();
  }, [hydrateFromCookie]);

  return <AppShell>{children}</AppShell>;
}
