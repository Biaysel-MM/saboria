-- AlterTable
ALTER TABLE `category` MODIFY `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️';

-- AlterTable
ALTER TABLE `product` MODIFY `emoji` VARCHAR(8) NOT NULL DEFAULT '🍽️';

-- AlterTable
ALTER TABLE `sitesetting` ADD COLUMN `heroLimit` INTEGER NOT NULL DEFAULT 6;
