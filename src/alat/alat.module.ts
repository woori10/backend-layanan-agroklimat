import { Module } from '@nestjs/common';
import { AlatService } from './alat.service';
import { AlatController } from './alat.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AlatService],
  controllers: [AlatController],
})
export class AlatModule {}
