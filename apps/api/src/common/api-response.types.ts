export type ApiResponse<T = unknown> = {
  code: number;
  message: string;
  data: T;
};

export const API_SUCCESS_CODE = 0;
export const API_SUCCESS_MESSAGE = 'success';
