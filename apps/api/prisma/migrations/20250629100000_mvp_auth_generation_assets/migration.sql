-- AlterTable
ALTER TABLE `users` ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `generation_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('image', 'video_t2v', 'video_i2v_first', 'video_i2v_first_tail', 'video_i2v_recamera') NOT NULL,
    `status` ENUM('pending', 'processing', 'done', 'failed') NOT NULL DEFAULT 'pending',
    `jimengTaskId` VARCHAR(191) NULL,
    `reqKey` VARCHAR(191) NOT NULL,
    `inputParams` JSON NOT NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    INDEX `generation_tasks_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `generation_tasks_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `type` ENUM('image', 'video') NOT NULL,
    `ossKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `metadata` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assets_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `assets_taskId_idx`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `generation_tasks` ADD CONSTRAINT `generation_tasks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `generation_tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
