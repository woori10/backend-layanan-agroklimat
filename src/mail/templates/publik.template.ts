export function renderTiketSubmittedEmail(
    nama: string,
    noTiket: string,
    namaLayanan: string,
    tanggalSubmit: Date,
    tanggalSla: Date | null,
    tiketUrl: string,
): { subject: string; html: string } {
    const formatTanggal = (d: Date) =>
        d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return {
        subject: `[${noTiket}] Pengajuan Layanan Berhasil - Portal Agroklimat`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Konfirmasi Pengajuan Layanan</p>
          </div>

          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${nama}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Pengajuan layanan Anda telah <strong>berhasil diterima</strong> oleh sistem Portal Agroklimat (BRMP). Berikut ringkasan pengajuan Anda:
            </p>

            <div style="background-color: #f4f4f5; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3f3f46;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%; color: #18181b;">Nomor Tiket</td>
                  <td style="padding: 6px 0;">: <strong style="color: #10b981; font-size: 15px;">${noTiket}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Layanan</td>
                  <td style="padding: 6px 0;">: ${namaLayanan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Tanggal Pengajuan</td>
                  <td style="padding: 6px 0;">: ${formatTanggal(tanggalSubmit)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Estimasi Selesai</td>
                  <td style="padding: 6px 0;">: ${tanggalSla ? formatTanggal(tanggalSla) : 'Akan dikonfirmasi'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Status</td>
                  <td style="padding: 6px 0;">: <span style="background-color: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;">Menunggu Verifikasi</span></td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Pengajuan Anda sedang dalam proses verifikasi oleh admin. Anda akan mendapat pemberitahuan lebih lanjut melalui email ini. Pantau status tiket secara real-time melalui portal:
            </p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${tiketUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                Pantau Status Tiket
              </a>
            </div>

            <p style="font-size: 12px; color: #a1a1aa; margin-top: 20px; line-height: 1.6;">
              * Jika Anda tidak merasa melakukan pengajuan ini, segera hubungi admin Portal Agroklimat.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
            <p style="margin: 5px 0 0 0;">Semua Hak Dilindungi.</p>
          </div>
        </div>`,
    };
}

export function renderTiketPerluRevisiEmail(
    nama: string,
    noTiket: string,
    namaLayanan: string,
    catatan: string | null,
    tiketUrl: string,
): { subject: string; html: string } {
    return {
        subject: `[${noTiket}] Pengajuan Perlu Diperbaiki - Portal Agroklimat`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Pengajuan Perlu Diperbaiki</p>
          </div>
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${nama}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Pengajuan layanan Anda dengan nomor tiket <strong style="color: #f59e0b;">${noTiket}</strong> untuk layanan <strong>${namaLayanan}</strong> memerlukan perbaikan sebelum dapat diproses lebih lanjut.
            </p>
            ${catatan ? `
            <div style="background-color: #fffbeb; border-radius: 10px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 6px;">📝 Catatan dari Admin:</p>
              <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">${catatan}</p>
            </div>` : ''}
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">Silakan perbaiki pengajuan Anda dan submit ulang melalui portal:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${tiketUrl}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Perbaiki Pengajuan
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
          </div>
        </div>`,
    };
}

export function renderTiketDitolakEmail(
    nama: string,
    noTiket: string,
    namaLayanan: string,
    catatan: string | null,
    tiketUrl: string,
): { subject: string; html: string } {
    return {
        subject: `[${noTiket}] Pengajuan Tidak Dapat Diproses - Portal Agroklimat`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ef4444; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Pengajuan Tidak Dapat Diproses</p>
          </div>
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${nama}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Mohon maaf, pengajuan layanan Anda dengan nomor tiket <strong style="color: #ef4444;">${noTiket}</strong> untuk layanan <strong>${namaLayanan}</strong> tidak dapat diproses.
            </p>
            ${catatan ? `
            <div style="background-color: #fef2f2; border-radius: 10px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #991b1b; margin-bottom: 6px;">📋 Alasan Penolakan:</p>
              <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">${catatan}</p>
            </div>` : ''}
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Jika Anda memiliki pertanyaan, silakan hubungi admin atau ajukan kembali layanan melalui portal.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${tiketUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Lihat Detail Tiket
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
          </div>
        </div>`,
    };
}

export function renderTiketDisetujuiEmail(
    nama: string,
    noTiket: string,
    namaLayanan: string,
    statusBaru: string,
    tiketUrl: string,
): { subject: string; html: string } {
    const statusMap: Record<string, { label: string; warna: string; pesan: string }> = {
        diproses: {
            label: 'Sedang Diproses',
            warna: '#3b82f6',
            pesan: 'Pengajuan Anda telah disetujui dan sedang dalam proses pengerjaan oleh tim kami.',
        },
        menunggu_pembayaran: {
            label: 'Menunggu Pembayaran',
            warna: '#f59e0b',
            pesan: 'Pengajuan Anda telah disetujui. Silakan lakukan pembayaran sesuai tagihan yang tertera di portal untuk melanjutkan proses.',
        },
        menunggu_persetujuan_kepala_balai: {
            label: 'Menunggu Persetujuan Kepala Balai',
            warna: '#8b5cf6',
            pesan: 'Pengajuan Anda telah disetujui oleh admin dan sedang menunggu persetujuan akhir dari Kepala Balai.',
        },
    };

    const info = statusMap[statusBaru] ?? {
        label: statusBaru,
        warna: '#10b981',
        pesan: 'Pengajuan Anda telah disetujui dan sedang diproses.',
    };

    return {
        subject: `[${noTiket}] Pengajuan Disetujui - Portal Agroklimat`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Pembaruan Status Pengajuan</p>
          </div>
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${nama}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">${info.pesan}</p>
            <div style="background-color: #f4f4f5; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid ${info.warna};">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3f3f46;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%; color: #18181b;">Nomor Tiket</td>
                  <td style="padding: 6px 0;">: <strong style="color: #10b981;">${noTiket}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Layanan</td>
                  <td style="padding: 6px 0;">: ${namaLayanan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Status Terbaru</td>
                  <td style="padding: 6px 0;">: <span style="background-color: ${info.warna}20; color: ${info.warna}; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;">${info.label}</span></td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${tiketUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Pantau Status Tiket
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
          </div>
        </div>`,
    };
}

export function renderTiketSelesaiEmail(
    nama: string,
    noTiket: string,
    namaLayanan: string,
    tiketUrl: string,
): { subject: string; html: string } {
    return {
        subject: `[${noTiket}] Layanan Telah Selesai - Portal Agroklimat`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Layanan Telah Selesai</p>
          </div>
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${nama}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              🎉 Kabar baik! Layanan Anda dengan nomor tiket <strong style="color: #10b981;">${noTiket}</strong> untuk <strong>${namaLayanan}</strong> telah <strong>selesai dikerjakan</strong>.
            </p>
            <div style="background-color: #f0fdf4; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3f3f46;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%; color: #18181b;">Nomor Tiket</td>
                  <td style="padding: 6px 0;">: <strong style="color: #10b981;">${noTiket}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Layanan</td>
                  <td style="padding: 6px 0;">: ${namaLayanan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Tanggal Selesai</td>
                  <td style="padding: 6px 0;">: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Status</td>
                  <td style="padding: 6px 0;">: <span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;">✓ Selesai</span></td>
                </tr>
              </table>
            </div>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Silakan akses portal untuk mengunduh hasil atau dokumen terkait layanan Anda.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${tiketUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Lihat Hasil Layanan
              </a>
            </div>
            <p style="font-size: 12px; color: #a1a1aa; margin-top: 20px;">
              Terima kasih telah menggunakan layanan Portal Agroklimat BRMP. Kepuasan Anda adalah prioritas kami.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
          </div>
        </div>`,
    };
}

export function renderTiketDiterimaEmail(
    nama: string,
    noTiket: string,
    namaLayanan: string,
    tiketUrl: string,
): { subject: string; html: string } {
    return {
        subject: `[${noTiket}] Permohonan Magang Diterima - Portal Agroklimat`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Pemberitahuan Penerimaan Magang</p>
          </div>
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${nama}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              🎉 Selamat! Pengajuan layanan magang/PKL Anda dengan nomor tiket <strong style="color: #10b981;">${noTiket}</strong> untuk <strong>${namaLayanan}</strong> telah <strong>diterima</strong> oleh Balai Riset Meteorologi Pertanian (BRMP).
            </p>
            <div style="background-color: #ecfdf5; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3f3f46;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%; color: #18181b;">Nomor Tiket</td>
                  <td style="padding: 6px 0;">: <strong style="color: #10b981;">${noTiket}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Layanan</td>
                  <td style="padding: 6px 0;">: ${namaLayanan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Status</td>
                  <td style="padding: 6px 0;">: <span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;">✓ Diterima</span></td>
                </tr>
              </table>
            </div>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Petugas telah menerbitkan <strong>Surat Penerimaan</strong> untuk Anda. Silakan login ke portal untuk mengunduh Surat Penerimaan resmi Anda.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${tiketUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Unduh Surat Penerimaan
              </a>
            </div>
            <p style="font-size: 12px; color: #a1a1aa; margin-top: 20px;">
              Terima kasih telah mengajukan permohonan ke Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
          </div>
        </div>`,
    };
}

