-- AlterEnum
ALTER TABLE `generation_tasks` MODIFY `type` ENUM(
  'image',
  'video_t2v',
  'video_i2v_first',
  'video_i2v_first_tail',
  'video_i2v_recamera',
  'video_seedance_t2v',
  'video_seedance_i2v_first',
  'video_seedance_i2v_first_tail',
  'video_seedance_r2v'
) NOT NULL;
