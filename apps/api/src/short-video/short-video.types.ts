export type EntityKind = 'character' | 'scene' | 'prop';

export type ParsedEntity = {
  id: string;
  kind: EntityKind;
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
  referenceAssetIds?: string[];
  seedancePromptDoc?: Record<string, unknown>;
  model?: '2.0' | '2.0-fast' | '2.0-mini';
  resolution?: string;
  videoTaskId?: string;
  videoAssetId?: string;
};

export type SegmentsData = {
  segments: Segment[];
};

export type ShortVideoTaskContext = {
  projectId: string;
  entityId?: string;
  segmentId?: string;
};
