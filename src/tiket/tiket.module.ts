import { Module } from '@nestjs/common';
import { TiketService } from './tiket.service';
import { TiketController } from './tiket.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TiketService],
  controllers: [TiketController]
})
export class TiketModule { }
