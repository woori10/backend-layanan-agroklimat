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
        role: 'publik',
        unit_teknis_id: dto.unit_teknis_id ?? null,
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
    nama: string;
    unit_teknis_id?: number | null;
  }) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
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

  async changePassword(userId: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password berhasil diubah' };
  }
}