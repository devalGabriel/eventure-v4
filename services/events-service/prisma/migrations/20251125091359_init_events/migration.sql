-- DropIndex
DROP INDEX `EventMessage_authorId_idx` ON `eventmessage`;

-- AlterTable
ALTER TABLE `eventmessage` ADD COLUMN `offerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `EventMessage_offerId_idx` ON `EventMessage`(`offerId`);
