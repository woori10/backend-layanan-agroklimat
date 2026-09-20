import { Module } from '@nestjs/common';
import { NotifikasiService } from './notifikasi.service';
import { NotifikasiController } from './notifikasi.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NotifikasiController],
    providers: [NotifikasiService],
    exports: [NotifikasiService],
})
export class NotifikasiModule {}
