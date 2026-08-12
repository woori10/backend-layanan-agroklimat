-- AlterTable
ALTER TABLE `tiket` MODIFY `status` ENUM('diajukan', 'menunggu_verifikasi', 'perlu_revisi', 'menunggu_pembayaran', 'diproses', 'selesai_diproses', 'menunggu_konfirmasi', 'selesai', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'diajukan';

-- CreateTable
CREATE TABLE `pengaduan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_pelapor` VARCHAR(191) NOT NULL,
    `no_hp` VARCHAR(191) NOT NULL,
    `status_pelapor` VARCHAR(191) NOT NULL,
    `layanan_id` INTEGER NOT NULL,
    `tanggal_kejadian` DATETIME(3) NOT NULL,
    `waktu` VARCHAR(191) NOT NULL,
    `detail_kejadian` TEXT NOT NULL,
    `dampak` TEXT NOT NULL,
    `harapan` TEXT NOT NULL,
    `bersedia_dihubungi` BOOLEAN NOT NULL,
    `bukti_pendukung` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_layanan_id_fkey` FOREIGN KEY (`layanan_id`) REFERENCES `layanan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
