/*
  Warnings:

  - You are about to drop the column `dasar_hukum` on the `layanan` table. All the data in the column will be lost.
  - You are about to drop the column `kategori` on the `layanan` table. All the data in the column will be lost.
  - The values [wa] on the enum `notifikasi_kanal` will be removed. If these variants are still used in the database, this will fail.
  - The values [menunggu_revisi,perlu_direvisi] on the enum `tiket_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `must_change_password` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(0))`.
  - The values [suspended] on the enum `users_status_akun` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `pengaduan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skm` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `pengaduan` DROP FOREIGN KEY `pengaduan_pelapor_id_fkey`;

-- DropForeignKey
ALTER TABLE `pengaduan` DROP FOREIGN KEY `pengaduan_petugas_id_fkey`;

-- DropForeignKey
ALTER TABLE `pengaduan` DROP FOREIGN KEY `pengaduan_tiket_id_fkey`;

-- DropForeignKey
ALTER TABLE `skm` DROP FOREIGN KEY `skm_tiket_id_fkey`;

-- AlterTable
ALTER TABLE `layanan` DROP COLUMN `dasar_hukum`,
    DROP COLUMN `kategori`;

-- AlterTable
ALTER TABLE `notifikasi` MODIFY `kanal` ENUM('dashboard', 'email') NOT NULL;

-- AlterTable
ALTER TABLE `tiket` MODIFY `status` ENUM('diajukan', 'menunggu_verifikasi', 'perlu_revisi', 'diproses', 'menunggu_pembayaran', 'dibatalkan', 'ditolak', 'selesai_diproses', 'menunggu_konfirmasi', 'selesai') NOT NULL DEFAULT 'diajukan';

-- AlterTable
ALTER TABLE `users` DROP COLUMN `must_change_password`,
    MODIFY `role` ENUM('super_admin', 'publik', 'admin', 'pegawai', 'kepala_balai') NOT NULL DEFAULT 'publik',
    MODIFY `status_akun` ENUM('active', 'inactive') NOT NULL DEFAULT 'active';

-- DropTable
DROP TABLE `pengaduan`;

-- DropTable
DROP TABLE `skm`;
