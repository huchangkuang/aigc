import { filterMentionItems } from '@/components/asset-mention-extension';
import { describe, expect, it } from 'vitest';

describe('filterMentionItems', () => {
  const items = [
    {
      assetId: 'a1',
      entityId: 'c1',
      entityName: '陆远',
      entityKind: 'character' as const,
      previewUrl: 'https://img/1.png',
    },
    {
      assetId: 'a2',
      entityId: 's1',
      entityName: '夜景',
      entityKind: 'scene' as const,
      previewUrl: 'https://img/2.png',
    },
  ];

  it('returns all items for empty query', () => {
    expect(filterMentionItems(items, '')).toHaveLength(2);
  });

  it('filters by entity name', () => {
    expect(filterMentionItems(items, '陆')).toEqual([items[0]]);
  });
});
