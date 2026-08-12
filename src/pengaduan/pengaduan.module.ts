import { Module } from '@nestjs/common';
import { PengaduanService } from './pengaduan.service';
import { PengaduanController } from './pengaduan.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryProvider } from '../common/config/cloudinary.config';
import { CloudinaryUploadService } from '../common/services/cloudinary-upload.service';

@Module({
    imports: [PrismaModule],
    providers: [
        PengaduanService,
        CloudinaryProvider,
        CloudinaryUploadService,
    ],
    controllers: [PengaduanController],
})
export class PengaduanModule {}
