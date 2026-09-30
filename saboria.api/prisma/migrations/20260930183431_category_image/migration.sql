-- AlterTable
ALTER TABLE `category` ADD COLUMN `imageUrl` VARCHAR(500) NULL,
    MODIFY `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️';

-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️';
