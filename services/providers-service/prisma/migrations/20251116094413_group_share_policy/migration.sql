-- AlterTable
ALTER TABLE `providergroup` ADD COLUMN `sharePolicy` ENUM('MANUAL', 'EQUAL') NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE `providergroupmember` ADD COLUMN `shareMode` ENUM('NONE', 'PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `shareValue` DECIMAL(10, 2) NULL;
