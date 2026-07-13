-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_unit_teknis_id_fkey`;

-- DropIndex
DROP INDEX `users_unit_teknis_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `users` MODIFY `unit_teknis_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_unit_teknis_id_fkey` FOREIGN KEY (`unit_teknis_id`) REFERENCES `unit_teknis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
