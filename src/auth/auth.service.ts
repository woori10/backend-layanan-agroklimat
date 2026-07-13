import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, LoginPegawaiDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
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

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        nama: dto.nama,
        no_hp: dto.no_hp,
        role: 'pengguna',
        unit_teknis_id: dto.unit_teknis_id ?? null,
        must_change_password: false, // user daftar sendiri, password udah dia pilih sendiri
      },
    });

    return this.buildLoginResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Email atau password salah');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Email atau password salah');

    return this.buildLoginResponse(user);
  }

  async loginPegawai(dto: LoginPegawaiDto) {
    const user = await this.prisma.user.findUnique({
      where: { nip: dto.nip },
    });
    if (!user) throw new UnauthorizedException('NIP atau password salah');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('NIP atau password salah');

    return this.buildLoginResponse(user);
  }

  private buildLoginResponse(user: {
    id: number;
    email: string | null;
    role: string;
    must_change_password: boolean;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      must_change_password: user.must_change_password,
    };
  }

  async logout() {
    return { message: 'Berhasil logout' };
  }

  async changePassword(userId: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        must_change_password: false,
      },
    });

    return { message: 'Password berhasil diubah' };
  }
}