-- AlterTable
ALTER TABLE `customers` ADD COLUMN `lastContactedAt` DATETIME(3) NULL,
    ADD COLUMN `ownerId` VARCHAR(191) NULL,
    ADD COLUMN `source` VARCHAR(120) NULL,
    ADD COLUMN `stage` ENUM('LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST') NOT NULL DEFAULT 'LEAD';

-- CreateTable
CREATE TABLE `crm_activities` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `type` ENUM('NOTE', 'CALL', 'EMAIL', 'MEETING', 'STAGE') NOT NULL DEFAULT 'NOTE',
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `crm_activities_customerId_createdAt_idx`(`customerId`, `createdAt`),
    INDEX `crm_activities_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `assigneeId` VARCHAR(191) NULL,
    `title` VARCHAR(200) NOT NULL,
    `dueAt` DATETIME(3) NULL,
    `status` ENUM('OPEN', 'DONE') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `crm_tasks_status_dueAt_idx`(`status`, `dueAt`),
    INDEX `crm_tasks_customerId_idx`(`customerId`),
    INDEX `crm_tasks_assigneeId_idx`(`assigneeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `color` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `crm_tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_tags` (
    `customerId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `customer_tags_tagId_idx`(`tagId`),
    PRIMARY KEY (`customerId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `customers_stage_idx` ON `customers`(`stage`);

-- CreateIndex
CREATE INDEX `customers_ownerId_idx` ON `customers`(`ownerId`);

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_tasks` ADD CONSTRAINT `crm_tasks_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_tags` ADD CONSTRAINT `customer_tags_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_tags` ADD CONSTRAINT `customer_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `crm_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
