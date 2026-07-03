-- AlterTable
ALTER TABLE `assets` ADD COLUMN `source` ENUM('material', 'short_video') NOT NULL DEFAULT 'material';

-- CreateTable
CREATE TABLE `short_video_projects` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `rawScript` TEXT NOT NULL,
    `parsedEntities` JSON NULL,
    `segments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `short_video_projects_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `short_video_projects` ADD CONSTRAINT `short_video_projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
