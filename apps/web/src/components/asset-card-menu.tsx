'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog, RenameDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { buildComposerDraft } from '@/lib/composer-draft';
import { getAssetDisplayTitle } from '@/lib/asset-display';
import { api, type Asset } from '@/lib/api-client';
import type { ComposerDraftMode } from '@/stores/composer-draft-store';
import { setComposerDraft } from '@/stores/composer-draft-store';
import { toast } from '@/stores/toast-store';

type AssetCardMenuProps = {
  asset: Asset;
  onChanged: () => void;
};

const MENU_ITEMS: Array<{ mode?: ComposerDraftMode; label: string; action: 'rename' | 'delete' | 'compose' }> = [
  { label: '重命名', action: 'rename' },
  { label: '删除', action: 'delete' },
  { label: '同款生成', action: 'compose', mode: 'similar' },
  { label: '仅用图片', action: 'compose', mode: 'imageOnly' },
  { label: '仅用提示词', action: 'compose', mode: 'promptOnly' },
];

export function AssetCardMenu({ asset, onChanged }: AssetCardMenuProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  async function handleCompose(mode: ComposerDraftMode) {
    setOpen(false);
    setBusy(true);
    try {
      const context = await api.getComposeContext(asset.id);

      if (mode === 'imageOnly' && !context.imageUrls.length) {
        toast('该资产没有可用的参考图', 'error');
        return;
      }

      if (mode === 'promptOnly' && !context.prompt) {
        toast('该资产没有提示词', 'error');
        return;
      }

      setComposerDraft(buildComposerDraft(context, mode));
      router.push('/generate');
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(title: string) {
    if (!title) {
      toast('标题不能为空', 'error');
      return;
    }

    setBusy(true);
    try {
      await api.renameAsset(asset.id, title);
      setRenameOpen(false);
      toast('重命名成功', 'success');
      onChanged();
    } catch (error) {
      toast(error instanceof Error ? error.message : '重命名失败', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await api.deleteAsset(asset.id);
      setDeleteOpen(false);
      toast('资产已删除', 'success');
      onChanged();
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除失败', 'error');
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
            {MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  if (item.action === 'rename') {
                    setOpen(false);
                    setRenameOpen(true);
                    return;
                  }
                  if (item.action === 'delete') {
                    setOpen(false);
                    setDeleteOpen(true);
                    return;
                  }
                  if (item.mode) {
                    handleCompose(item.mode);
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <RenameDialog
        open={renameOpen}
        initialTitle={getAssetDisplayTitle(asset)}
        onConfirm={handleRename}
        onCancel={() => setRenameOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="删除资产"
        description="删除后资产将从画廊中移除，此操作不可撤销。"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
