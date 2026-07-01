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
    binary_data_base64?: string[];
    video_url?: string;
  };
  message?: string;
  request_id?: string;
};
