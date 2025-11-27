/*
  Warnings:

  - You are about to drop the column `groupId` on the `eventoffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `eventinvitation` ADD COLUMN `message` TEXT NULL,
    ADD COLUMN `providerGroupId` VARCHAR(191) NULL,
    ADD COLUMN `replyDeadline` DATETIME(3) NULL,
    ADD COLUMN `roleHint` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    MODIFY `providerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `eventoffer` DROP COLUMN `groupId`,
    ADD COLUMN `detailsJson` JSON NULL,
    ADD COLUMN `invitationId` VARCHAR(191) NULL,
    ADD COLUMN `providerGroupId` VARCHAR(191) NULL,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
    MODIFY `status` ENUM('DRAFT', 'SENT', 'REVISED', 'ACCEPTED', 'ACCEPTED_BY_CLIENT', 'DECLINED', 'REJECTED', 'REJECTED_BY_CLIENT', 'WITHDRAWN', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `offer` MODIFY `status` ENUM('DRAFT', 'SENT', 'REVISED', 'ACCEPTED', 'ACCEPTED_BY_CLIENT', 'DECLINED', 'REJECTED', 'REJECTED_BY_CLIENT', 'WITHDRAWN', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `EventProviderAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NULL,
    `providerGroupId` VARCHAR(191) NULL,
    `status` ENUM('SHORTLISTED', 'SELECTED', 'CONFIRMED_PRE_CONTRACT') NOT NULL DEFAULT 'SHORTLISTED',
    `sourceOfferId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventProviderAssignment_eventId_idx`(`eventId`),
    INDEX `EventProviderAssignment_providerId_idx`(`providerId`),
    INDEX `EventProviderAssignment_providerGroupId_idx`(`providerGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `EventInvitation_providerGroupId_idx` ON `EventInvitation`(`providerGroupId`);

-- CreateIndex
CREATE INDEX `EventOffer_invitationId_idx` ON `EventOffer`(`invitationId`);

-- AddForeignKey
ALTER TABLE `EventInvitation` ADD CONSTRAINT `EventInvitation_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventProviderAssignment` ADD CONSTRAINT `EventProviderAssignment_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
