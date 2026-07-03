export type ParsedEntity = {
  id: string;
  kind: 'character' | 'scene' | 'prop';
  name: string;
  description: string;
  imagePrompt: string;
  assetId?: string;
  imageTaskId?: string;
};

export type ParsedEntities = {
  characters: ParsedEntity[];
  scenes: ParsedEntity[];
  props: ParsedEntity[];
};

export type Segment = {
  id: string;
  order: number;
  durationSec: number;
  visualStyle?: string;
  sceneDescription: string;
  characterRefIds: string[];
  sceneRefId?: string;
  propRefIds: string[];
  seedancePrompt: string;
  model?: '2.0' | '2.0-fast' | '2.0-mini';
  videoTaskId?: string;
  videoAssetId?: string;
};

export type SegmentsData = {
  segments: Segment[];
};

export type ShortVideoProject = {
  id: string;
  title: string;
  rawScript: string;
  parsedEntities: ParsedEntities | null;
  segments: SegmentsData | null;
  createdAt: string;
  updatedAt: string;
};

export type ShortVideoProjectSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  parsedEntities: ParsedEntities | null;
  segments: SegmentsData | null;
};

export const ENTITY_KIND_LABEL: Record<ParsedEntity['kind'], string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
};

export const SEEDANCE_MODELS = [
  { id: '2.0', label: 'Seedance 2.0' },
  { id: '2.0-fast', label: 'Seedance 2.0 Fast' },
  { id: '2.0-mini', label: 'Seedance 2.0 Mini' },
] as const;

export function flattenEntities(entities: ParsedEntities | null | undefined) {
  if (!entities) return [];
  return [...entities.characters, ...entities.scenes, ...entities.props];
}
