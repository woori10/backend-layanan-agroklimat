-- AlterTable
ALTER TABLE `tiket` MODIFY `status` ENUM('diajukan', 'menunggu_verifikasi', 'menunggu_persetujuan_kepala_balai', 'perlu_revisi', 'menunggu_pembayaran', 'diproses', 'selesai_diproses', 'menunggu_konfirmasi', 'selesai', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'diajukan';
