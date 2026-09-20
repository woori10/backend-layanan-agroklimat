export function renderPegawaiNotifDisposisiEmail(
    namaPegawai: string,
    noTiket: string,
    namaPemohon: string,
    namaLayanan: string,
    unitTeknisNama: string,
    actionUrl: string,
): { subject: string; html: string } {
    return {
        subject: `[Disposisi Layanan] Tiket Baru #${noTiket} Masuk ke Unit ${unitTeknisNama}`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Notifikasi Tugas Unit Teknis</p>
          </div>
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${namaPegawai}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Terdapat tiket permohonan layanan baru yang telah didisposisikan ke unit kerja Anda (<strong>${unitTeknisNama}</strong>) dan siap untuk diproses/dikerjakan.
            </p>
            <div style="background-color: #f0fdf4; border-radius: 10px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #3f3f46;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 40%; color: #18181b;">Nomor Tiket</td>
                  <td style="padding: 6px 0;">: <strong style="color: #10b981;">${noTiket}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Nama Pemohon</td>
                  <td style="padding: 6px 0;">: ${namaPemohon}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Jenis Layanan</td>
                  <td style="padding: 6px 0;">: ${namaLayanan}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Unit Kerja</td>
                  <td style="padding: 6px 0;">: ${unitTeknisNama}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #18181b;">Status</td>
                  <td style="padding: 6px 0;">: <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600;">Siap Diproses</span></td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${actionUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                Buka Menu Tugas Layanan
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
          </div>
        </div>`,
    };
}
