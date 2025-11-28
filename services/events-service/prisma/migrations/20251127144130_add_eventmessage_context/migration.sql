-- AlterTable
ALTER TABLE `eventmessage` ADD COLUMN `context` ENUM('EVENT', 'OFFER') NOT NULL DEFAULT 'EVENT';

-- CreateIndex
CREATE INDEX `EventMessage_context_idx` ON `EventMessage`(`context`);
