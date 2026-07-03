import { BadRequestException } from '@nestjs/common';
import type { ParsedEntities, SegmentsData } from './short-video.types';

const ENTITY_SYSTEM_PROMPT = `你是短视频剧本分析助手。根据用户剧本，提取角色、场景、道具。
返回 JSON 对象，格式：
{
  "characters": [{ "id": "c1", "name": "...", "description": "...", "imagePrompt": "用于文生图的英文或中文提示词" }],
  "scenes": [{ "id": "s1", "name": "...", "description": "...", "imagePrompt": "..." }],
  "props": [{ "id": "p1", "name": "...", "description": "...", "imagePrompt": "..." }]
}
id 使用稳定短 id。imagePrompt 应可直接用于 AI 生图。只返回 JSON。`;

const SEGMENT_SYSTEM_PROMPT = `你是短视频分镜脚本助手。根据剧本和已提取的实体，生成分镜片段。
返回 JSON：{ "segments": [{ "id": "seg1", "order": 0, "durationSec": 5, "visualStyle": "...", "sceneDescription": "...", "characterRefIds": ["c1"], "sceneRefId": "s1", "propRefIds": [], "seedancePrompt": "适合 Seedance 视频模型的完整提示词" }] }
seedancePrompt 必须使用中文，包含画面内容、镜头运动、光影氛围等描述。
durationSec 在 4-15 之间。只返回 JSON。`;

export function buildEntityParseMessages(rawScript: string) {
  return [
    { role: 'system' as const, content: ENTITY_SYSTEM_PROMPT },
    { role: 'user' as const, content: rawScript },
  ];
}

export function buildSegmentParseMessages(
  rawScript: string,
  entities: ParsedEntities,
) {
  return [
    { role: 'system' as const, content: SEGMENT_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `剧本：\n${rawScript}\n\n实体：\n${JSON.stringify(entities)}`,
    },
  ];
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`Invalid LLM output: ${field}`);
  }
  return value.trim();
}

function parseEntityList(raw: unknown, kind: 'character' | 'scene' | 'prop') {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException('Invalid entity item');
    }
    const record = item as Record<string, unknown>;
    return {
      id: asString(record.id ?? `${kind[0]}${index + 1}`, 'entity.id'),
      kind,
      name: asString(record.name, 'entity.name'),
      description: asString(record.description, 'entity.description'),
      imagePrompt: asString(record.imagePrompt, 'entity.imagePrompt'),
    };
  });
}

export function parseEntitiesJson(payload: unknown): ParsedEntities {
  if (!payload || typeof payload !== 'object') {
    throw new BadRequestException('Invalid entities JSON');
  }
  const record = payload as Record<string, unknown>;
  return {
    characters: parseEntityList(record.characters, 'character'),
    scenes: parseEntityList(record.scenes, 'scene'),
    props: parseEntityList(record.props, 'prop'),
  };
}

export function parseSegmentsJson(payload: unknown): SegmentsData {
  if (!payload || typeof payload !== 'object') {
    throw new BadRequestException('Invalid segments JSON');
  }
  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.segments)) {
    throw new BadRequestException('Invalid segments array');
  }

  const segments = record.segments.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException('Invalid segment item');
    }
    const seg = item as Record<string, unknown>;
    const durationSec = Number(seg.durationSec ?? 5);
    if (!Number.isFinite(durationSec) || durationSec < 4 || durationSec > 15) {
      throw new BadRequestException('Invalid segment durationSec');
    }

    return {
      id: asString(seg.id ?? `seg${index + 1}`, 'segment.id'),
      order: typeof seg.order === 'number' ? seg.order : index,
      durationSec,
      visualStyle:
        typeof seg.visualStyle === 'string' ? seg.visualStyle : undefined,
      sceneDescription: asString(seg.sceneDescription, 'segment.sceneDescription'),
      characterRefIds: Array.isArray(seg.characterRefIds)
        ? seg.characterRefIds.filter((id): id is string => typeof id === 'string')
        : [],
      sceneRefId: typeof seg.sceneRefId === 'string' ? seg.sceneRefId : undefined,
      propRefIds: Array.isArray(seg.propRefIds)
        ? seg.propRefIds.filter((id): id is string => typeof id === 'string')
        : [],
      seedancePrompt: asString(seg.seedancePrompt, 'segment.seedancePrompt'),
    };
  });

  return { segments };
}
