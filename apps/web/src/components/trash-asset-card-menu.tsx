'use client';

import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { api, type Asset } from '@/lib/api-client';
import { toast } from '@/stores/toast-store';

type TrashAssetCardMenuProps = {
  asset: Asset;
  onChanged: () => void;
};

export function TrashAssetCardMenu({ asset, onChanged }: TrashAssetCardMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  async function handleRestore() {
    setOpen(false);
    setBusy(true);
    try {
      await api.restoreAsset(asset.id);
      toast('资产已恢复', 'success');
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDestroy() {
    setBusy(true);
    try {
      await api.destroyAsset(asset.id);
      setDestroyOpen(false);
      toast('资产已永久销毁', 'success');
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-surface/80 backdrop-blur-md text-on-surface transition-colors hover:text-primary"
          aria-label="更多操作"
          aria-expanded={open}
        >
          <Icon name="more_vert" className="text-sm" />
        </button>

        {open ? (
          <div
            className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-high py-1 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
              onClick={handleRestore}
            >
              恢复
            </button>
            <button
              type="button"
              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-error transition-colors hover:bg-error/10"
              onClick={() => {
                setOpen(false);
                setDestroyOpen(true);
              }}
            >
              永久销毁
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={destroyOpen}
        title="永久销毁资产"
        description="销毁后无法恢复，OSS 文件将被删除。确定要继续吗？"
        confirmLabel="永久销毁"
        onConfirm={handleDestroy}
        onCancel={() => setDestroyOpen(false)}
      />
    </>
  );
}
