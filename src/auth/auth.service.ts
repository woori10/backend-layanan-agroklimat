import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto, LoginPegawaiDto, ForgotPasswordDto, ResetPasswordDto, VerifyCurrentPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async register(dto: RegisterDto, clientUrl?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('Email sudah terdaftar');

    if (dto.unit_teknis_id) {
      const unitTeknis = await this.prisma.unitTeknis.findUnique({
        where: { id: dto.unit_teknis_id },
      });
      if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nama: dto.nama,
        no_hp: dto.no_hp,
        role: 'publik',
        unit_teknis_id: dto.unit_teknis_id ?? null,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
      },
    });

    try {
      await this.mailService.sendVerificationEmail(
        user.email!,
        verificationToken,
        user.nama,
        clientUrl,
      );
    } catch (err) {
      // Jika kirim email gagal, hapus user yang baru dibuat agar email bisa didaftarkan ulang
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new ConflictException(
        'Gagal mengirim email verifikasi. Silakan periksa kembali email Anda atau coba beberapa saat lagi.',
      );
    }

    return {
      message: 'Registrasi berhasil. Silakan periksa email Anda untuk melakukan verifikasi akun.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Email atau password salah');

    if (user.status_akun === 'inactive') {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Silakan hubungi Super Admin.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Email atau password salah');

    if (user.role === 'publik' && !user.email_verified) {
      throw new UnauthorizedException('Email Anda belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.');
    }

    return this.buildLoginResponse(user);
  }

  async loginPegawai(dto: LoginPegawaiDto) {
    const cleanUsername = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (!user) throw new UnauthorizedException('Username atau password salah');

    if (user.status_akun === 'inactive') {
      throw new UnauthorizedException('Akun Anda dinonaktifkan. Silakan hubungi Super Admin.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Username atau password salah');

    return this.buildLoginResponse(user);
  }

  private buildLoginResponse(user: {
    id: number;
    email: string | null;
    username?: string | null;
    nip?: string | null;
    role: string;
    nama: string;
    unit_teknis_id?: number | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      nip: user.nip,
      role: user.role,
      nama: user.nama,
      unit_teknis_id: user.unit_teknis_id
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout() {
    return { message: 'Berhasil logout' };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        username: true,
        email: true,
        nip: true,
        no_hp: true,
        role: true,
        instansi: true,
        alamat: true,
        unit_teknis_id: true,
      },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    if (dto.nip && dto.nip !== user.nip) {
      const existingNip = await this.prisma.user.findUnique({
        where: { nip: dto.nip },
      });
      if (existingNip) throw new ConflictException('NIK/NIP sudah terdaftar');
    }

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) throw new ConflictException('Email sudah terdaftar');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const tokenPayload = this.buildLoginResponse(updated);

    return {
      message: 'Profil berhasil diperbarui',
      user: {
        id: updated.id,
        nama: updated.nama,
        username: updated.username,
        email: updated.email,
        nip: updated.nip,
        no_hp: updated.no_hp,
        role: updated.role,
        instansi: updated.instansi,
        alamat: updated.alamat,
      },
      ...tokenPayload,
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token verifikasi tidak valid');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        verification_token: token,
      },
    });

    if (!user) {
      throw new NotFoundException('Token verifikasi tidak valid atau tidak ditemukan');
    }

    if (user.verification_token_expires && user.verification_token_expires < new Date()) {
      // Hapus token meskipun sudah kedaluwarsa
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verification_token: null,
          verification_token_expires: null,
        },
      });
      throw new BadRequestException('Token verifikasi telah kedaluwarsa. Silakan lakukan registrasi ulang.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      },
    });

    return { message: 'Email berhasil diverifikasi. Akun Anda sekarang aktif.' };
  }

  async forgotPassword(dto: ForgotPasswordDto, clientUrl?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Selalu kembalikan pesan sukses demi keamanan (tidak membocorkan info email)
    if (!user) {
      return { message: 'Jika email terdaftar, link reset password telah dikirimkan.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      },
    });

    try {
      await this.mailService.sendPasswordResetEmail(user.email!, resetToken, user.nama, clientUrl);
    } catch (err) {
      // Hapus token jika email gagal dikirim
      await this.prisma.user.update({
        where: { id: user.id },
        data: { reset_token: null, reset_token_expires: null },
      });
      throw new BadRequestException('Gagal mengirim email reset password. Silakan coba lagi.');
    }

    return { message: 'Jika email terdaftar, link reset password telah dikirimkan.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password dan konfirmasi password tidak cocok.');
    }

    const user = await this.prisma.user.findFirst({
      where: { reset_token: dto.token },
    });

    if (!user) {
      throw new NotFoundException('Token reset password tidak valid atau sudah digunakan.');
    }

    if (user.reset_token_expires && user.reset_token_expires < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { reset_token: null, reset_token_expires: null },
      });
      throw new BadRequestException('Token reset password telah kedaluwarsa. Silakan minta link baru.');
    }

    // 1. Cek apakah password baru sama dengan password saat ini/sebelumnya
    if (user.password) {
      const isCurrentPassword = await bcrypt.compare(dto.password, user.password);
      if (isCurrentPassword) {
        throw new BadRequestException('Kata sandi baru tidak boleh sama dengan kata sandi sebelumnya.');
      }
    }

    // 2. Cek apakah password baru pernah digunakan sebelumnya di riwayat password
    const histories = await this.prisma.passwordHistory.findMany({
      where: { user_id: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const history of histories) {
      const isUsed = await bcrypt.compare(dto.password, history.password);
      if (isUsed) {
        throw new BadRequestException('Kata sandi ini sudah pernah digunakan sebelumnya. Silakan gunakan kata sandi yang berbeda.');
      }
    }

    // 3. Simpan password lama ke tabel riwayat password sebelum diganti
    if (user.password) {
      await this.prisma.passwordHistory.create({
        data: {
          user_id: user.id,
          password: user.password,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    return { message: 'Password berhasil direset. Silakan login dengan password baru Anda.' };
  }

  async verifyCurrentPassword(userId: number, dto: VerifyCurrentPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new NotFoundException('Pengguna tidak ditemukan atau tidak memiliki kata sandi.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Kata sandi saat ini yang Anda masukkan salah.');
    }

    return { valid: true, message: 'Kata sandi saat ini terverifikasi.' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
    }

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('Kata sandi baru minimal 6 karakter.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    // 1. Cek apakah kata sandi baru sama dengan kata sandi saat ini
    if (user.password) {
      const isCurrentPassword = await bcrypt.compare(dto.newPassword, user.password);
      if (isCurrentPassword) {
        throw new BadRequestException('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
      }
    }

    // 2. Cek apakah kata sandi baru pernah digunakan sebelumnya
    const histories = await this.prisma.passwordHistory.findMany({
      where: { user_id: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const history of histories) {
      const isUsed = await bcrypt.compare(dto.newPassword, history.password);
      if (isUsed) {
        throw new BadRequestException('Kata sandi ini sudah pernah digunakan sebelumnya. Silakan gunakan kata sandi yang berbeda.');
      }
    }

    // 3. Simpan password saat ini ke riwayat
    if (user.password) {
      await this.prisma.passwordHistory.create({
        data: {
          user_id: user.id,
          password: user.password,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Kata sandi berhasil diubah.' };
  }
}