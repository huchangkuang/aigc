import { Node, mergeAttributes } from '@tiptap/core';
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import type { AdoptedEntityImageItem } from '@/lib/api-client';

export type AssetMentionAttrs = {
  assetId: string;
  label: string;
  previewUrl?: string;
};

export const assetMentionPluginKey = new PluginKey('assetMention');

export function filterMentionItems(items: AdoptedEntityImageItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.entityName.toLowerCase().includes(q));
}

export const AssetMention = Node.create({
  name: 'assetMention',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      assetId: { default: null },
      label: { default: null },
      previewUrl: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-asset-mention]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-asset-mention': '',
        'data-asset-id': node.attrs.assetId,
        class: 'segment-asset-mention',
      }),
      `@${node.attrs.label}`,
    ];
  },

  addProseMirrorPlugins() {
    const getItems = () =>
      (this.options as { mentionItems: AdoptedEntityImageItem[] }).mentionItems;

    return [
      Suggestion<AdoptedEntityImageItem, AssetMentionAttrs>({
        editor: this.editor,
        char: '@',
        pluginKey: assetMentionPluginKey,
        items: ({ query }) => filterMentionItems(getItems(), query),
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: {
                  assetId: props.assetId,
                  label: props.entityName,
                  previewUrl: props.previewUrl,
                },
              },
              { type: 'text', text: ' ' },
            ])
            .run();
        },
        render: () => {
          let listHost: HTMLDivElement | null = null;
          let selectedIndex = 0;
          let currentProps: SuggestionProps<AdoptedEntityImageItem, AssetMentionAttrs> | null =
            null;

          const updateSelection = () => {
            if (!listHost || !currentProps) return;
            const buttons = listHost.querySelectorAll('[data-mention-item]');
            buttons.forEach((button, index) => {
              button.classList.toggle('bg-primary/20', index === selectedIndex);
            });
          };

          const selectItem = (index: number) => {
            if (!currentProps) return;
            const item = currentProps.items[index];
            if (item) currentProps.command(item);
          };

          return {
            onStart: (props) => {
              currentProps = props;
              selectedIndex = 0;
              listHost = document.createElement('div');
              listHost.className =
                'segment-mention-list absolute z-50 max-h-48 w-64 overflow-auto rounded-lg border border-outline-variant/40 bg-surface-container-high p-1 shadow-lg';
              listHost.setAttribute('data-testid', 'mention-list');
              document.body.appendChild(listHost);
            },
            onUpdate: (props) => {
              currentProps = props;
              if (!listHost) return;
              listHost.innerHTML = '';
              if (!props.items.length) {
                const empty = document.createElement('div');
                empty.className = 'px-2 py-1 text-xs text-on-surface-variant';
                empty.textContent = '无已采纳参考图';
                listHost.appendChild(empty);
                return;
              }
              props.items.forEach((item, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.setAttribute('data-mention-item', String(index));
                button.className =
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-on-surface hover:bg-surface-container';
                button.innerHTML = `<img src="${item.previewUrl}" alt="" class="h-8 w-8 rounded object-cover" /><span>${item.entityName}</span>`;
                button.addEventListener('mousedown', (event) => {
                  event.preventDefault();
                  selectItem(index);
                });
                listHost!.appendChild(button);
              });
              updateSelection();
              const rect = props.clientRect?.();
              if (rect && listHost) {
                listHost.style.top = `${rect.bottom + 4}px`;
                listHost.style.left = `${rect.left}px`;
              }
            },
            onKeyDown: ({ event }) => {
              if (!currentProps?.items.length) return false;
              if (event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % currentProps.items.length;
                updateSelection();
                return true;
              }
              if (event.key === 'ArrowUp') {
                selectedIndex =
                  (selectedIndex - 1 + currentProps.items.length) % currentProps.items.length;
                updateSelection();
                return true;
              }
              if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
              }
              return false;
            },
            onExit: () => {
              listHost?.remove();
              listHost = null;
              currentProps = null;
            },
          };
        },
      }),
    ];
  },

  addOptions() {
    return {
      mentionItems: [] as AdoptedEntityImageItem[],
    };
  },
});
