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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule, PrismaModule, UsersModule, LayananModule, TiketModule, DokumenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
