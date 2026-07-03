export type ArkContentItem =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: { url: string };
      role: 'reference_image';
    }
  | {
      type: 'video_url';
      video_url: { url: string };
      role: 'reference_video';
    }
  | {
      type: 'audio_url';
      audio_url: { url: string };
      role: 'reference_audio';
    };

export type ArkCreateTaskBody = {
  model: string;
  content: ArkContentItem[];
  generate_audio?: boolean;
  ratio?: string;
  duration?: number;
  watermark?: boolean;
};

export type ArkCreateTaskResponse = {
  id: string;
};

export type ArkTaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ArkGetTaskResponse = {
  id: string;
  status: ArkTaskStatus;
  content?: { video_url?: string };
  error?: { message?: string; code?: string };
};
