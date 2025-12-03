-- CreateTable
CREATE TABLE `EventBrief` (
    `eventId` VARCHAR(191) NOT NULL,
    `guestCount` INTEGER NULL,
    `city` VARCHAR(191) NULL,
    `style` VARCHAR(191) NULL,
    `locationType` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `initialBudget` DECIMAL(12, 2) NULL,
    `realBudget` DECIMAL(12, 2) NULL,

    INDEX `EventBrief_eventId_idx`(`eventId`),
    PRIMARY KEY (`eventId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventBrief` ADD CONSTRAINT `EventBrief_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
