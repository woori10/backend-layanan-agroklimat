/*
  Warnings:

  - The values [selesai_diproses] on the enum `tiket_status` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[nama_layanan]` on the table `layanan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `layanan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verification_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reset_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `layanan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `layanan` ADD COLUMN `slug` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tagihan` ADD COLUMN `bank_pengirim` VARCHAR(191) NULL,
    ADD COLUMN `nama_pengirim` VARCHAR(191) NULL,
    ADD COLUMN `tanggal_transfer` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `tiket` MODIFY `status` ENUM('diajukan', 'menunggu_verifikasi', 'menunggu_persetujuan_kepala_balai', 'perlu_revisi', 'menunggu_pembayaran', 'diproses', 'menunggu_konfirmasi', 'selesai', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'diajukan';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `alamat` TEXT NULL,
    ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `instansi` VARCHAR(191) NULL,
    ADD COLUMN `reset_token` VARCHAR(191) NULL,
    ADD COLUMN `reset_token_expires` DATETIME(3) NULL,
    ADD COLUMN `verification_token` VARCHAR(191) NULL,
    ADD COLUMN `verification_token_expires` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `layanan_nama_layanan_key` ON `layanan`(`nama_layanan`);

-- CreateIndex
CREATE UNIQUE INDEX `layanan_slug_key` ON `layanan`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `users_verification_token_key` ON `users`(`verification_token`);

-- CreateIndex
CREATE UNIQUE INDEX `users_reset_token_key` ON `users`(`reset_token`);
