-- CreateTable
CREATE TABLE `EventGuestbookEntry` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventGuestbookEntry_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventGuestbookEntry` ADD CONSTRAINT `EventGuestbookEntry_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
