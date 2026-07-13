/*
  Warnings:

  - A unique constraint covering the columns `[nip]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `must_change_password` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `nip` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `no_hp` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_nip_key` ON `users`(`nip`);
