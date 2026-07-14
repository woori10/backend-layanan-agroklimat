import { Module } from '@nestjs/common';
import { LayananService } from './layanan.service';
import { LayananController } from './layanan.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LayananService],
  controllers: [LayananController]
})
export class LayananModule { }
