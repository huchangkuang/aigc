import type { ParsedEntities, ParsedEntity, Segment, SegmentsData } from './short-video.types';

function flattenEntities(data: ParsedEntities): ParsedEntity[] {
  return [...data.characters, ...data.scenes, ...data.props];
}

function indexById(entities: ParsedEntity[]): Map<string, ParsedEntity> {
  return new Map(entities.map((item) => [item.id, item]));
}

export function mergeParsedEntities(
  existing: ParsedEntities | null | undefined,
  incoming: ParsedEntities,
): ParsedEntities {
  const prev = indexById(existing ? flattenEntities(existing) : []);

  const mergeList = (items: ParsedEntity[], kind: ParsedEntity['kind']) => {
    const incomingIds = new Set(items.map((item) => item.id));
    const mergedIncoming = items.map((item) => {
      const old = prev.get(item.id);
      return {
        ...item,
        kind,
        assetId: old?.assetId,
        imageTaskId: old?.imageTaskId,
      };
    });
    const keptOld = flattenEntities(existing ?? { characters: [], scenes: [], props: [] })
      .filter((item) => item.kind === kind && !incomingIds.has(item.id));
    return [...mergedIncoming, ...keptOld];
  };

  return {
    characters: mergeList(incoming.characters, 'character'),
    scenes: mergeList(incoming.scenes, 'scene'),
    props: mergeList(incoming.props, 'prop'),
  };
}

export function mergeSegments(
  existing: SegmentsData | null | undefined,
  incoming: SegmentsData,
): SegmentsData {
  const prev = new Map((existing?.segments ?? []).map((item) => [item.id, item]));

  const merged = incoming.segments.map((item) => {
    const old = prev.get(item.id);
    return {
      ...item,
      videoTaskId: old?.videoTaskId,
      videoAssetId: old?.videoAssetId,
    };
  });

  const incomingIds = new Set(incoming.segments.map((item) => item.id));
  const keptOld = (existing?.segments ?? []).filter((item) => !incomingIds.has(item.id));

  return { segments: [...merged, ...keptOld].sort((a, b) => a.order - b.order) };
}

export function findEntity(
  entities: ParsedEntities | null | undefined,
  entityId: string,
): ParsedEntity | undefined {
  if (!entities) return undefined;
  return flattenEntities(entities).find((item) => item.id === entityId);
}

export function findSegment(
  segments: SegmentsData | null | undefined,
  segmentId: string,
): Segment | undefined {
  return segments?.segments.find((item) => item.id === segmentId);
}

export function updateEntityInParsed(
  entities: ParsedEntities,
  entityId: string,
  patch: Partial<ParsedEntity>,
): ParsedEntities {
  const updateList = (list: ParsedEntity[]) =>
    list.map((item) => (item.id === entityId ? { ...item, ...patch } : item));

  return {
    characters: updateList(entities.characters),
    scenes: updateList(entities.scenes),
    props: updateList(entities.props),
  };
}

export function updateSegmentInData(
  data: SegmentsData,
  segmentId: string,
  patch: Partial<Segment>,
): SegmentsData {
  return {
    segments: data.segments.map((item) =>
      item.id === segmentId ? { ...item, ...patch } : item,
    ),
  };
}
