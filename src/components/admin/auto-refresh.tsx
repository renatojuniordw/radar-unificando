'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Re-renderiza os server components do dashboard em intervalo (monitoramento ao vivo). */
export function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}