import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { LayananModule } from './layanan/layanan.module';
import { TiketModule } from './tiket/tiket.module';
import { DokumenModule } from './dokumen/dokumen.module';
import { PengaduanModule } from './pengaduan/pengaduan.module';
import { AlatModule } from './alat/alat.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { MailModule } from './mail/mail.module';
import { FaqModule } from './faq/faq.module';
import { NotifikasiModule } from './notifikasi/notifikasi.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule, PrismaModule, UsersModule, LayananModule, TiketModule, DokumenModule, PengaduanModule, AlatModule, AuditLogModule, MailModule, FaqModule, NotifikasiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
