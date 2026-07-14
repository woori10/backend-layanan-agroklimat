/*
  Warnings:

  - The values [telepon,langsung] on the enum `pengaduan_kanal` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `pengaduan` MODIFY `kanal` ENUM('website', 'email', 'whatsapp') NOT NULL;
