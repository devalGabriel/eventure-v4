-- AlterTable
ALTER TABLE `event` ADD COLUMN `budgetPlanned` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `EventNeed` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NULL,
    `subcategoryId` INTEGER NULL,
    `tagId` INTEGER NULL,
    `label` VARCHAR(191) NULL,
    `budgetPlanned` DECIMAL(12, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventNeed_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventNeed` ADD CONSTRAINT `EventNeed_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
