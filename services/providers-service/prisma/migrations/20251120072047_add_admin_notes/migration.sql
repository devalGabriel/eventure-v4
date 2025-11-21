-- CreateTable
CREATE TABLE `ProviderAdminNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerId` INTEGER NOT NULL,
    `adminUserId` INTEGER NOT NULL,
    `adminName` VARCHAR(191) NULL,
    `note` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProviderAdminNote_providerId_idx`(`providerId`),
    INDEX `ProviderAdminNote_adminUserId_idx`(`adminUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProviderAdminNote` ADD CONSTRAINT `ProviderAdminNote_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `ProviderProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
