import { Module } from '@nestjs/common';
import { DokumenService } from './dokumen.service';
import { DokumenController } from './dokumen.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryProvider } from 'src/common/config/cloudinary.config';
import { CloudinaryUploadService } from 'src/common/services/cloudinary-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [DokumenService, CloudinaryProvider, CloudinaryUploadService],
  controllers: [DokumenController]
})
export class DokumenModule { }
