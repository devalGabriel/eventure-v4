-- AlterTable
ALTER TABLE `event` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `eventneed` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `eventproviderassignment` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;
