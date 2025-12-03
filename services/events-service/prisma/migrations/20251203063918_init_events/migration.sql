/*
  Warnings:

  - Added the required column `updatedAt` to the `EventParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `eventguestbookentry` ADD COLUMN `tokenId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `eventparticipant` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `EventGuestbookToken` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `type` ENUM('GENERIC', 'PARTICIPANT', 'EMAIL') NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `participantUserId` VARCHAR(191) NULL,
    `participantRole` ENUM('CLIENT', 'PROVIDER', 'ADMIN') NULL,
    `email` VARCHAR(191) NULL,
    `nameHint` VARCHAR(191) NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `canRead` BOOLEAN NOT NULL DEFAULT true,
    `canWrite` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventGuestbookToken_token_key`(`token`),
    INDEX `EventGuestbookToken_eventId_idx`(`eventId`),
    INDEX `EventGuestbookToken_participantUserId_participantRole_idx`(`participantUserId`, `participantRole`),
    INDEX `EventGuestbookToken_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `EventGuestbookEntry_tokenId_idx` ON `EventGuestbookEntry`(`tokenId`);

-- AddForeignKey
ALTER TABLE `EventGuestbookToken` ADD CONSTRAINT `EventGuestbookToken_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventGuestbookToken` ADD CONSTRAINT `EventGuestbookToken_eventId_participantUserId_participantRo_fkey` FOREIGN KEY (`eventId`, `participantUserId`, `participantRole`) REFERENCES `EventParticipant`(`eventId`, `userId`, `role`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventGuestbookEntry` ADD CONSTRAINT `EventGuestbookEntry_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `EventGuestbookToken`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
