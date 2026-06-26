'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

export function ApiStatus() {
  const { apiStatus, setApiStatus } = useAppStore();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    setApiStatus('loading');

    fetch(`${apiUrl}/`)
      .then((res) => (res.ok ? setApiStatus('ok') : setApiStatus('error')))
      .catch(() => setApiStatus('error'));
  }, [setApiStatus]);

  const statusLabel = {
    idle: '等待检测',
    loading: '检测中...',
    ok: '已连接',
    error: '未连接',
  }[apiStatus];

  const statusColor = {
    idle: 'text-zinc-500',
    loading: 'text-amber-600',
    ok: 'text-emerald-600',
    error: 'text-red-600',
  }[apiStatus];

  return (
    <p className={`text-sm font-medium ${statusColor}`}>
      API 状态：{statusLabel}
    </p>
  );
}
