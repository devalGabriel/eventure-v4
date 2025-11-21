-- AlterTable
ALTER TABLE `providerapplication` ADD COLUMN `decisionAt` DATETIME(3) NULL,
    ADD COLUMN `decisionByUserId` VARCHAR(191) NULL,
    ADD COLUMN `decisionReasonCode` VARCHAR(191) NULL,
    ADD COLUMN `decisionReasonText` VARCHAR(191) NULL;
