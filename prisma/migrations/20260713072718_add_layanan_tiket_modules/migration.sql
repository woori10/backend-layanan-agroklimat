-- CreateTable
CREATE TABLE `layanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_layanan` VARCHAR(191) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `biaya` JSON NOT NULL,
    `sla_hari` INTEGER NULL,
    `dasar_hukum` VARCHAR(191) NOT NULL,
    `form_schema` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tiket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_tiket` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `layanan_id` INTEGER NOT NULL,
    `status` ENUM('diajukan', 'menunggu_revisi', 'perlu_direvisi', 'diproses', 'menunggu_pembayaran', 'dibatalkan', 'selesai_diproses', 'menunggu_konfirmasi', 'selesai') NOT NULL DEFAULT 'diajukan',
    `tanggal_submit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggal_sla` DATETIME(3) NULL,
    `unit_teknis_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tiket_no_tiket_key`(`no_tiket`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dokumen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiket_id` INTEGER NOT NULL,
    `nama_file` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `url_storage` VARCHAR(191) NOT NULL,
    `tanggal_upload` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiket_id` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `status_bayar` ENUM('menunggu', 'lunas', 'batal') NOT NULL DEFAULT 'menunggu',
    `bukti_bayar` VARCHAR(191) NULL,
    `tanggal_lunas` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tagihan_tiket_id_key`(`tiket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `tiket_id` INTEGER NULL,
    `kanal` ENUM('dashboard', 'email', 'wa') NOT NULL,
    `pesan` TEXT NOT NULL,
    `status_kirim` BOOLEAN NOT NULL DEFAULT false,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiket_id` INTEGER NOT NULL,
    `skor` INTEGER NOT NULL,
    `komentar` TEXT NULL,
    `tanggal_isi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `skm_tiket_id_key`(`tiket_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengaduan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pelapor_id` INTEGER NOT NULL,
    `tiket_id` INTEGER NULL,
    `kanal` ENUM('website', 'email', 'whatsapp', 'telepon', 'langsung') NOT NULL,
    `isi_pengaduan` TEXT NOT NULL,
    `status` ENUM('baru', 'diproses', 'selesai', 'ditolak') NOT NULL DEFAULT 'baru',
    `petugas_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `tiket_id` INTEGER NULL,
    `aksi` VARCHAR(191) NOT NULL,
    `detail_perubahan` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tiket` ADD CONSTRAINT `tiket_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiket` ADD CONSTRAINT `tiket_layanan_id_fkey` FOREIGN KEY (`layanan_id`) REFERENCES `layanan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiket` ADD CONSTRAINT `tiket_unit_teknis_id_fkey` FOREIGN KEY (`unit_teknis_id`) REFERENCES `unit_teknis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dokumen` ADD CONSTRAINT `dokumen_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skm` ADD CONSTRAINT `skm_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_pelapor_id_fkey` FOREIGN KEY (`pelapor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_petugas_id_fkey` FOREIGN KEY (`petugas_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_tiket_id_fkey` FOREIGN KEY (`tiket_id`) REFERENCES `tiket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
