/*
  Warnings:

  - You are about to drop the column `invitedId` on the `eventinvitation` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `eventinvitation` table. All the data in the column will be lost.
  - You are about to drop the column `respondedAt` on the `eventinvitation` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `eventinvitation` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `eventinvitation` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(2))`.
  - The values [REJECTED,WITHDRAWN] on the enum `Offer_status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `clientId` to the `EventInvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `EventInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `eventinvitation` DROP FOREIGN KEY `EventInvitation_eventId_fkey`;

-- DropIndex
DROP INDEX `EventInvitation_eventId_invitedId_role_key` ON `eventinvitation`;

-- DropIndex
DROP INDEX `EventInvitation_invitedId_idx` ON `eventinvitation`;

-- AlterTable
ALTER TABLE `eventinvitation` DROP COLUMN `invitedId`,
    DROP COLUMN `message`,
    DROP COLUMN `respondedAt`,
    DROP COLUMN `role`,
    ADD COLUMN `clientId` VARCHAR(191) NOT NULL,
    ADD COLUMN `decidedAt` DATETIME(3) NULL,
    ADD COLUMN `note` TEXT NULL,
    ADD COLUMN `providerId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `eventoffer` MODIFY `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `Offer` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `serviceGroupId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'RON',
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Offer_eventId_idx`(`eventId`),
    INDEX `Offer_providerId_idx`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventProgram` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `title` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventProgram_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `EventInvitation_providerId_idx` ON `EventInvitation`(`providerId`);
