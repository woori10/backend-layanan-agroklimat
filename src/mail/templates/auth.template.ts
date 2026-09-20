export function renderVerificationEmail(name: string, verificationUrl: string): { subject: string; html: string } {
    return {
        subject: 'Verifikasi Email - Portal Agroklimat',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Verifikasi Alamat Email Anda</p>
          </div>
          
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${name}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Terima kasih telah mendaftar di <strong>Portal Agroklimat (BRMP)</strong>. Untuk mengaktifkan akun Anda dan memastikan email ini benar, silakan verifikasi alamat email Anda dengan mengeklik tombol di bawah ini:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                Verifikasi Email Sekarang
              </a>
            </div>
            
            <p style="font-size: 13px; color: #71717a; line-height: 1.6; background-color: #f4f4f5; padding: 12px; border-radius: 8px;">
              Jika tombol di atas tidak berfungsi, Anda juga dapat menyalin dan menempelkan tautan berikut ke browser Anda:<br/>
              <a href="${verificationUrl}" style="color: #10b981; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="font-size: 12px; color: #a1a1aa; margin-top: 25px;">
              * Tautan verifikasi ini berlaku selama 24 jam. Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
            <p style="margin: 5px 0 0 0;">Semua Hak Dilindungi.</p>
          </div>
        </div>`,
    };
}

export function renderPasswordResetEmail(name: string, resetUrl: string): { subject: string; html: string } {
    return {
        subject: 'Reset Password - Portal Agroklimat',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Portal Agroklimat</h2>
            <p style="color: #71717a; font-size: 14px; margin: 5px 0 0 0;">Permintaan Reset Password</p>
          </div>
          
          <div style="padding: 10px 0;">
            <p style="font-size: 16px; color: #18181b; margin-top: 0;">Halo, <strong>${name}</strong>!</p>
            <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
              Kami menerima permintaan untuk mereset password akun Anda di <strong>Portal Agroklimat (BRMP)</strong>. Klik tombol di bawah untuk membuat password baru:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                Reset Password Sekarang
              </a>
            </div>
            
            <p style="font-size: 13px; color: #71717a; line-height: 1.6; background-color: #f4f4f5; padding: 12px; border-radius: 8px;">
              Jika tombol di atas tidak berfungsi, salin dan tempelkan tautan berikut ke browser Anda:<br/>
              <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 12px; color: #a1a1aa; margin-top: 25px;">
              * Tautan ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini — password Anda tidak akan berubah.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e4e4e7; padding-top: 20px; font-size: 12px; color: #71717a;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Balai Riset Meteorologi Pertanian (BRMP) Agroklimat.</p>
            <p style="margin: 5px 0 0 0;">Semua Hak Dilindungi.</p>
          </div>
        </div>`,
    };
}
