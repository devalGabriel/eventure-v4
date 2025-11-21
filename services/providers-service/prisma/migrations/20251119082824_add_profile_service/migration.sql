/*
  Warnings:

  - Made the column `role` on table `providergroupmember` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `providergroupmember` ADD COLUMN `serviceOfferId` INTEGER NULL,
    ADD COLUMN `specializationTag` VARCHAR(191) NULL,
    MODIFY `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'MEMBER_MUTED') NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE `serviceoffer` ADD COLUMN `baseCostPerHour` DECIMAL(10, 2) NULL,
    ADD COLUMN `baseFixedCost` DECIMAL(10, 2) NULL,
    ADD COLUMN `minMarginPercent` INTEGER NULL,
    ADD COLUMN `ownershipType` ENUM('SOLO', 'GROUP') NOT NULL DEFAULT 'SOLO';

-- AlterTable
ALTER TABLE `servicepackage` ADD COLUMN `serviceOfferId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `ProviderGroupMember_serviceOfferId_idx` ON `ProviderGroupMember`(`serviceOfferId`);

-- CreateIndex
CREATE INDEX `ServicePackage_serviceOfferId_idx` ON `ServicePackage`(`serviceOfferId`);

-- AddForeignKey
ALTER TABLE `ServicePackage` ADD CONSTRAINT `ServicePackage_serviceOfferId_fkey` FOREIGN KEY (`serviceOfferId`) REFERENCES `ServiceOffer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderGroupMember` ADD CONSTRAINT `ProviderGroupMember_serviceOfferId_fkey` FOREIGN KEY (`serviceOfferId`) REFERENCES `ServiceOffer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
