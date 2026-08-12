import { Module } from '@nestjs/common';
import { DokumenService } from './dokumen.service';
import { DokumenController } from './dokumen.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleDriveUploadService } from '../common/services/google-drive-upload.service';

@Module({
  imports: [PrismaModule],
  controllers: [DokumenController],
  providers: [DokumenService, GoogleDriveUploadService],
})
export class DokumenModule { }