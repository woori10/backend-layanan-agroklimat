import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

// Import Templates per Role/Target User
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
} from './templates/auth.template';
import {
  renderTiketSubmittedEmail,
  renderTiketPerluRevisiEmail,
  renderTiketDitolakEmail,
  renderTiketDisetujuiEmail,
  renderTiketDiterimaEmail,
  renderTiketSelesaiEmail,
} from './templates/publik.template';
import { renderAdminNotifTiketBaruEmail } from './templates/admin.template';
import { renderKepalaBalaiNotifPersetujuanEmail } from './templates/kepala-balai.template';
import { renderPegawaiNotifDisposisiEmail } from './templates/pegawai.template';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('SMTP Mail Transporter initialized successfully.');
    } else {
      this.logger.warn(
        'SMTP configurations missing. MailService will run in local/console mode.',
      );
    }
  }

  private get fromAddress(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ||
      '"Portal Agroklimat" <no-reply@agroklimat.id>'
    );
  }

  private get frontendUrl(): string {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/^FRONTEND_URL\s*=\s*(.+)$/m);
        if (match && match[1]) {
          return match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // ignore, fall back to configService
    }
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3001'
    );
  }

  private async send(mailOptions: { from: string; to: string; subject: string; html: string }) {
    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${mailOptions.to} [Subject: ${mailOptions.subject}]`);
    } else {
      this.logger.log('=== EMAIL SIMULATION (Console Mode) ===');
      this.logger.log(`To: ${mailOptions.to}`);
      this.logger.log(`Subject: ${mailOptions.subject}`);
      this.logger.log('=======================================');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION EMAILS (Verifikasi Registrasi & Reset Password)
  // ══════════════════════════════════════════════════════════════════════════

  async sendVerificationEmail(email: string, token: string, name: string, clientUrl?: string) {
    const base = clientUrl || this.frontendUrl;
    const verificationUrl = `${base}/verify-email?token=${token}`;
    const { subject, html } = renderVerificationEmail(name, verificationUrl);
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  async sendPasswordResetEmail(email: string, token: string, name: string, clientUrl?: string) {
    const base = clientUrl || this.frontendUrl;
    const resetUrl = `${base}/reset-password?token=${token}`;
    const { subject, html } = renderPasswordResetEmail(name, resetUrl);
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PEMOHON LAYANAN (PUBLIK) EMAILS
  // ══════════════════════════════════════════════════════════════════════════

  async sendTiketSubmittedEmail(
    email: string,
    nama: string,
    noTiket: string,
    namaLayanan: string,
    tanggalSubmit: Date,
    tanggalSla: Date | null,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const tiketUrl = `${base}/layanan-saya/${noTiket}`;
    const { subject, html } = renderTiketSubmittedEmail(
      nama,
      noTiket,
      namaLayanan,
      tanggalSubmit,
      tanggalSla,
      tiketUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  async sendTiketPerluRevisiEmail(
    email: string,
    nama: string,
    noTiket: string,
    namaLayanan: string,
    catatan: string | null,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const tiketUrl = `${base}/layanan-saya/${noTiket}`;
    const { subject, html } = renderTiketPerluRevisiEmail(
      nama,
      noTiket,
      namaLayanan,
      catatan,
      tiketUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  async sendTiketDitolakEmail(
    email: string,
    nama: string,
    noTiket: string,
    namaLayanan: string,
    catatan: string | null,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const tiketUrl = `${base}/layanan-saya/${noTiket}`;
    const { subject, html } = renderTiketDitolakEmail(
      nama,
      noTiket,
      namaLayanan,
      catatan,
      tiketUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  async sendTiketDisetujuiEmail(
    email: string,
    nama: string,
    noTiket: string,
    namaLayanan: string,
    statusBaru: string,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const tiketUrl = `${base}/layanan-saya/${noTiket}`;
    const { subject, html } = renderTiketDisetujuiEmail(
      nama,
      noTiket,
      namaLayanan,
      statusBaru,
      tiketUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  async sendTiketDiterimaEmail(
    email: string,
    nama: string,
    noTiket: string,
    namaLayanan: string,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const tiketUrl = `${base}/layanan-saya/${noTiket}`;
    const { subject, html } = renderTiketDiterimaEmail(
      nama,
      noTiket,
      namaLayanan,
      tiketUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  async sendTiketSelesaiEmail(
    email: string,
    nama: string,
    noTiket: string,
    namaLayanan: string,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const tiketUrl = `${base}/layanan-saya/${noTiket}`;
    const { subject, html } = renderTiketSelesaiEmail(
      nama,
      noTiket,
      namaLayanan,
      tiketUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ADMIN VERIFIKATOR EMAILS
  // ══════════════════════════════════════════════════════════════════════════

  async sendAdminNotifTiketBaruEmail(
    email: string,
    namaAdmin: string,
    slug: string,
    noTiket: string,
    namaPemohon: string,
    namaLayanan: string,
    tanggalSubmit: Date,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const actionUrl = `${base}/verifikasi-layanan/${slug}/${noTiket}`;
    const { subject, html } = renderAdminNotifTiketBaruEmail(
      namaAdmin,
      noTiket,
      namaPemohon,
      namaLayanan,
      tanggalSubmit,
      actionUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. KEPALA BALAI EMAILS
  // ══════════════════════════════════════════════════════════════════════════

  async sendKepalaBalaiNotifPersetujuanEmail(
    email: string,
    namaKepalaBalai: string,
    noTiket: string,
    slug: string,
    namaPemohon: string,
    namaLayanan: string,
    unitTeknisNama: string,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const actionUrl = `${base}/persetujuan-layanan/${slug}/${noTiket}`;
    const { subject, html } = renderKepalaBalaiNotifPersetujuanEmail(
      namaKepalaBalai,
      noTiket,
      namaPemohon,
      namaLayanan,
      unitTeknisNama,
      actionUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. PEGAWAI UNIT TEKNIS EMAILS
  // ══════════════════════════════════════════════════════════════════════════

  async sendPegawaiNotifDisposisiEmail(
    email: string,
    namaPegawai: string,
    noTiket: string,
    slug: string,
    namaPemohon: string,
    namaLayanan: string,
    unitTeknisNama: string,
    clientUrl?: string,
  ) {
    const base = clientUrl || this.frontendUrl;
    const actionUrl = `${base}/penugasan-layanan/${slug}/${noTiket}`;
    const { subject, html } = renderPegawaiNotifDisposisiEmail(
      namaPegawai,
      noTiket,
      namaPemohon,
      namaLayanan,
      unitTeknisNama,
      actionUrl,
    );
    return this.send({ from: this.fromAddress, to: email, subject, html });
  }
}

