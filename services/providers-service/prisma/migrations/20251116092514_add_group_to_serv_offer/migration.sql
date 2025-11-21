-- CreateTable
CREATE TABLE `ProviderProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `status` ENUM('INCOMPLETE', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'DELISTED') NOT NULL DEFAULT 'INCOMPLETE',
    `displayName` VARCHAR(191) NULL,
    `legalName` VARCHAR(191) NULL,
    `taxId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProviderProfile_userId_key`(`userId`),
    INDEX `ProviderProfile_city_idx`(`city`),
    INDEX `ProviderProfile_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProviderCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderSubcategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProviderSubcategory_slug_key`(`slug`),
    INDEX `ProviderSubcategory_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subcategoryId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProviderTag_slug_key`(`slug`),
    INDEX `ProviderTag_subcategoryId_idx`(`subcategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderProfileCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `subcategoryId` INTEGER NOT NULL,

    INDEX `ProviderProfileCategory_subcategoryId_idx`(`subcategoryId`),
    UNIQUE INDEX `ProviderProfileCategory_providerProfileId_subcategoryId_key`(`providerProfileId`, `subcategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderProfileTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    INDEX `ProviderProfileTag_tagId_idx`(`tagId`),
    UNIQUE INDEX `ProviderProfileTag_providerProfileId_tagId_key`(`providerProfileId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceOffer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `subcategoryId` INTEGER NULL,
    `groupId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `basePrice` DECIMAL(10, 2) NULL,
    `currency` ENUM('RON', 'EUR', 'USD') NULL DEFAULT 'RON',
    `pricingUnit` VARCHAR(191) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `durationMinutes` INTEGER NULL,
    `canOverlap` BOOLEAN NOT NULL DEFAULT false,
    `maxEventsPerDay` INTEGER NULL,
    `maxGuests` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceOffer_providerProfileId_idx`(`providerProfileId`),
    INDEX `ServiceOffer_subcategoryId_idx`(`subcategoryId`),
    INDEX `ServiceOffer_status_idx`(`status`),
    INDEX `ServiceOffer_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceOfferTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceOfferId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    INDEX `ServiceOfferTag_tagId_idx`(`tagId`),
    UNIQUE INDEX `ServiceOfferTag_serviceOfferId_tagId_key`(`serviceOfferId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicePackage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `type` ENUM('SINGLE_EVENT', 'MULTI_DAY', 'SUBSCRIPTION') NOT NULL DEFAULT 'SINGLE_EVENT',
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `basePrice` DOUBLE NULL,
    `currency` ENUM('RON', 'EUR', 'USD') NULL DEFAULT 'RON',
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `internalOnly` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServicePackage_providerProfileId_idx`(`providerProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicePackageItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `packageId` INTEGER NOT NULL,
    `serviceOfferId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `overridePrice` DOUBLE NULL,

    INDEX `ServicePackageItem_serviceOfferId_idx`(`serviceOfferId`),
    UNIQUE INDEX `ServicePackageItem_packageId_serviceOfferId_key`(`packageId`, `serviceOfferId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderGroup_providerProfileId_idx`(`providerProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderGroupMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderGroupMember_groupId_idx`(`groupId`),
    INDEX `ProviderGroupMember_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderAvailability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `dateFrom` DATETIME(3) NOT NULL,
    `dateTo` DATETIME(3) NOT NULL,
    `status` ENUM('AVAILABLE', 'LIMITED', 'BOOKED') NOT NULL DEFAULT 'BOOKED',
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderAvailability_providerProfileId_idx`(`providerProfileId`),
    INDEX `ProviderAvailability_dateFrom_idx`(`dateFrom`),
    INDEX `ProviderAvailability_dateTo_idx`(`dateTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerProfileId` INTEGER NOT NULL,
    `clientUserId` INTEGER NOT NULL,
    `eventId` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PUBLIC',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderReview_providerProfileId_idx`(`providerProfileId`),
    INDEX `ProviderReview_clientUserId_idx`(`clientUserId`),
    INDEX `ProviderReview_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProviderSubcategory` ADD CONSTRAINT `ProviderSubcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProviderCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderTag` ADD CONSTRAINT `ProviderTag_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `ProviderSubcategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderProfileCategory` ADD CONSTRAINT `ProviderProfileCategory_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderProfileCategory` ADD CONSTRAINT `ProviderProfileCategory_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `ProviderSubcategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderProfileTag` ADD CONSTRAINT `ProviderProfileTag_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderProfileTag` ADD CONSTRAINT `ProviderProfileTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `ProviderTag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceOffer` ADD CONSTRAINT `ServiceOffer_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceOffer` ADD CONSTRAINT `ServiceOffer_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `ProviderSubcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceOffer` ADD CONSTRAINT `ServiceOffer_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `ProviderGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceOfferTag` ADD CONSTRAINT `ServiceOfferTag_serviceOfferId_fkey` FOREIGN KEY (`serviceOfferId`) REFERENCES `ServiceOffer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceOfferTag` ADD CONSTRAINT `ServiceOfferTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `ProviderTag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicePackage` ADD CONSTRAINT `ServicePackage_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicePackageItem` ADD CONSTRAINT `ServicePackageItem_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `ServicePackage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicePackageItem` ADD CONSTRAINT `ServicePackageItem_serviceOfferId_fkey` FOREIGN KEY (`serviceOfferId`) REFERENCES `ServiceOffer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderGroup` ADD CONSTRAINT `ProviderGroup_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderGroupMember` ADD CONSTRAINT `ProviderGroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `ProviderGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderAvailability` ADD CONSTRAINT `ProviderAvailability_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderReview` ADD CONSTRAINT `ProviderReview_providerProfileId_fkey` FOREIGN KEY (`providerProfileId`) REFERENCES `ProviderProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
