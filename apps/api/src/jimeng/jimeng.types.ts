import { GenerationType } from '@prisma/client';

export const REQ_KEY_MAP: Record<GenerationType, string> = {
  image: 'jimeng_seedream46_cvtob',
  video_t2v: 'jimeng_t2v_v30',
  video_i2v_first: 'jimeng_i2v_first_v30',
  video_i2v_first_tail: 'jimeng_i2v_first_tail_v30',
  video_i2v_recamera: 'jimeng_i2v_recamera_v30',
};

export type JimengSubmitResponse = {
  code: number;
  data?: { task_id?: string };
  message?: string;
  request_id?: string;
};

export type JimengResultResponse = {
  code: number;
  data?: {
    status?: string;
    image_urls?: string[];
    video_url?: string;
  };
  message?: string;
  request_id?: string;
};
