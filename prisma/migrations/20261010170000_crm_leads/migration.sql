-- CreateTable
CREATE TABLE `crm_leads` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(200) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `source` VARCHAR(120) NULL,
    `notes` TEXT NULL,
    `stage` ENUM('LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST') NOT NULL DEFAULT 'LEAD',
    `ownerId` VARCHAR(191) NULL,
    `convertedCustomerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `crm_leads_email_key`(`email`),
    UNIQUE INDEX `crm_leads_convertedCustomerId_key`(`convertedCustomerId`),
    INDEX `crm_leads_stage_createdAt_idx`(`stage`, `createdAt`),
    INDEX `crm_leads_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `crm_leads` ADD CONSTRAINT `crm_leads_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_leads` ADD CONSTRAINT `crm_leads_convertedCustomerId_fkey` FOREIGN KEY (`convertedCustomerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
