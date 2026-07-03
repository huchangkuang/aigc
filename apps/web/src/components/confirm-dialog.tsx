'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const dialogPanelClass =
  'glass-panel w-[min(calc(100vw-3rem),28rem)] shrink-0 rounded-xl border border-outline-variant/40 p-6 shadow-2xl';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={dialogPanelClass} onClick={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-error px-4 py-2 text-sm font-medium text-on-error transition-opacity hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type RenameDialogProps = {
  open: boolean;
  initialTitle: string;
  heading?: string;
  ariaLabel?: string;
  confirmLabel?: string;
  placeholder?: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
};

export function RenameDialog({
  open,
  initialTitle,
  heading = '重命名',
  ariaLabel,
  confirmLabel = '保存',
  placeholder,
  onConfirm,
  onCancel,
}: RenameDialogProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? heading}
    >
      <form
        className={dialogPanelClass}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const input = form.elements.namedItem('title') as HTMLInputElement;
          onConfirm(input.value.trim());
        }}
      >
        <h3 className="text-lg font-semibold text-on-surface">{heading}</h3>
        <input
          name="title"
          defaultValue={initialTitle}
          maxLength={120}
          placeholder={placeholder}
          autoFocus
          required
          className="mt-4 block w-full rounded-lg border border-outline-variant bg-surface-container-high px-4 py-2.5 text-base text-on-surface outline-none focus:border-primary"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            取消
          </button>
          <button
            type="submit"
            className="gradient-button cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-on-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
