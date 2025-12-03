-- CreateTable
CREATE TABLE `ProviderUnavailable` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,

    INDEX `ProviderUnavailable_providerId_idx`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProviderUnavailable` ADD CONSTRAINT `ProviderUnavailable_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
