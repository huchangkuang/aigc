export function isSeedanceGenerationType(type: string) {
  return type.startsWith('video_seedance_');
}

export function maxSeedanceReferenceImages(type: string) {
  switch (type) {
    case 'video_seedance_i2v_first':
      return 1;
    case 'video_seedance_i2v_first_tail':
      return 2;
    case 'video_seedance_r2v':
      return 14;
    default:
      return 0;
  }
}

export function seedanceImageUploadLabel(type: string) {
  switch (type) {
    case 'video_seedance_i2v_first':
      return '上传首帧';
    case 'video_seedance_i2v_first_tail':
      return '上传帧图';
    case 'video_seedance_r2v':
      return '上传参考图';
    default:
      return '上传参考图';
  }
}

export function seedanceImageUploadHint(type: string) {
  switch (type) {
    case 'video_seedance_i2v_first':
      return '首帧图 1 张，JPG、PNG、WEBP，最大 10MB';
    case 'video_seedance_i2v_first_tail':
      return '按顺序上传首帧、尾帧各 1 张';
    case 'video_seedance_r2v':
      return '参考图可选，上传后自动获得可访问 URL';
    default:
      return '';
  }
}
