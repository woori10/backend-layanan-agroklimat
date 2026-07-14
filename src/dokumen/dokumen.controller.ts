import {
    Controller,
    Post,
    Get,
    Param,
    ParseIntPipe,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DokumenService } from './dokumen.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tiket/:tiketId/dokumen')
export class DokumenController {
    constructor(private dokumenService: DokumenService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @UploadedFile() file: Express.Multer.File,
        @Body('tipe') tipe: string,
    ) {
        return this.dokumenService.uploadDokumen(req.user.userId, tiketId, file, tipe);
    }

    @Get()
    findAll(@Request() req, @Param('tiketId', ParseIntPipe) tiketId: number) {
        return this.dokumenService.findAllByTiket(req.user.userId, tiketId);
    }
}