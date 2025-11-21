/*
  Warnings:

  - You are about to drop the column `decisionAt` on the `providerapplication` table. All the data in the column will be lost.
  - You are about to drop the column `decisionByUserId` on the `providerapplication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `providerapplication` DROP COLUMN `decisionAt`,
    DROP COLUMN `decisionByUserId`;
