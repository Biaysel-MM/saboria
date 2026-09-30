-- CreateTable
CREATE TABLE `Admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(100) NOT NULL,
    `fullName` VARCHAR(120) NOT NULL DEFAULT 'Administrador',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️',
    `note` VARCHAR(160) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `tag` VARCHAR(60) NOT NULL,
    `description` TEXT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️',
    `imageUrl` VARCHAR(500) NULL,
    `c1` VARCHAR(9) NOT NULL DEFAULT '#ffffff',
    `c2` VARCHAR(9) NOT NULL DEFAULT '#f0f0f0',
    `c3` VARCHAR(9) NOT NULL DEFAULT '#e0e0e0',
    `accent` VARCHAR(9) NOT NULL DEFAULT '#888888',
    `categoryId` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `footerDescription` TEXT NOT NULL,
    `scheduleWeek` VARCHAR(120) NOT NULL,
    `scheduleSaturday` VARCHAR(120) NOT NULL,
    `scheduleSunday` VARCHAR(120) NOT NULL,
    `address` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `menuBadge` VARCHAR(80) NOT NULL,
    `menuTitle` VARCHAR(160) NOT NULL,
    `menuText` TEXT NOT NULL,
    `catalogBadge` VARCHAR(80) NOT NULL,
    `catalogTitle` VARCHAR(160) NOT NULL,
    `catalogText` TEXT NOT NULL,
    `ctaTitle` VARCHAR(160) NOT NULL,
    `ctaText` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
