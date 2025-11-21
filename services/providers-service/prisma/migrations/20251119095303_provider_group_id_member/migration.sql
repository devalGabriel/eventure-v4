/*
  Warnings:

  - You are about to drop the column `userId` on the `providergroupmember` table. All the data in the column will be lost.
  - The values [OWNER,MEMBER_MUTED] on the enum `ProviderGroupMember_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `shareValue` on the `providergroupmember` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - A unique constraint covering the columns `[groupId,providerProfileId,serviceOfferId]` on the table `ProviderGroupMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerProfileId` to the `ProviderGroupMember` table without a default value. This is not possible if the table is not empty.
  - Made the column `serviceOfferId` on table `providergroupmember` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `providergroupmember` DROP FOREIGN KEY `ProviderGroupMember_serviceOfferId_fkey`;

-- DropIndex
DROP INDEX `ProviderGroupMember_userId_idx` ON `providergroupmember`;

-- AlterTable
ALTER TABLE `providergroupmember` DROP COLUMN `userId`,
    ADD COLUMN `providerProfileId` INTEGER NOT NULL,
    MODIFY `role` ENUM('ADMIN', 'MEMBER', 'MEMBER_NO_CHAT') NOT NULL DEFAULT 'MEMBER',
    MODIFY `shareValue` DOUBLE NULL,
    MODIFY `serviceOfferId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `ProviderGroupMember_providerProfileId_idx` ON `ProviderGroupMember`(`providerProfileId`);

-- CreateIndex
CREATE UNIQUE INDEX `ProviderGroupMember_groupId_providerProfileId_serviceOfferId_key` ON `ProviderGroupMember`(`groupId`, `providerProfileId`, `serviceOfferId`);

-- AddForeignKey
ALTER TABLE `ProviderGroupMember` ADD CONSTRAINT `ProviderGroupMember_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderGroupMember` ADD CONSTRAINT `ProviderGroupMember_serviceOfferId_fkey` FOREIGN KEY (`serviceOfferId`) REFERENCES `ServiceOffer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
