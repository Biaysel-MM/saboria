-- Respuestas a reseñas (un solo nivel) y varias respuestas por usuario.
--
-- * parentId: la reseña de la que es respuesta (null = reseña principal).
-- * rating pasa a anulable: las respuestas no llevan estrellas.
-- * Se elimina la única (productId, userId): un usuario ahora puede dejar
--   varias respuestas en el mismo producto (la única reseña principal se
--   controla en el servicio).

-- DropIndex
DROP INDEX `Review_productId_userId_key` ON `Review`;

-- AlterTable
ALTER TABLE `Review` MODIFY `rating` TINYINT NULL;

-- AlterTable
ALTER TABLE `Review` ADD COLUMN `parentId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Review_parentId_idx` ON `Review`(`parentId`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
