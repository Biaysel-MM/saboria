-- Usuarios unificados (panel + clientes) y reseñas con valoración.
--
-- La tabla `admin` pasa a `User` con role='admin'; se conserva la fila
-- existente (el admin del seed) marcándola como verificada.

-- AlterTable (el default de emoji quedó corrupto en la migración init)
ALTER TABLE `category` MODIFY `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️';

-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️';

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(100) NOT NULL,
    `fullName` VARCHAR(120) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'cliente',
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifyCode` VARCHAR(10) NULL,
    `verifyCodeExpiresAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrar el admin existente (lo marcamos como verificado y con rol admin)
INSERT INTO `User` (`email`, `passwordHash`, `fullName`, `role`, `emailVerified`, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt`)
SELECT `email`, `passwordHash`, `fullName`, 'admin', true, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt`
FROM `admin`;

-- DropTable (los datos ya viven en User)
DROP TABLE `admin`;

-- CreateTable
CREATE TABLE `Review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NULL,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `productId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `Review_productId_idx`(`productId`),
    UNIQUE INDEX `Review_productId_userId_key`(`productId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
