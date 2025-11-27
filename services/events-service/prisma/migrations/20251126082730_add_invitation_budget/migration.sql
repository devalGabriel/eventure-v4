-- AlterTable
ALTER TABLE `eventinvitation` ADD COLUMN `budgetCurrency` VARCHAR(191) NULL,
    ADD COLUMN `proposedBudget` DECIMAL(65, 30) NULL;
