import {
    Controller,
    Get,
    Patch,
    Param,
    ParseIntPipe,
    UseGuards,
    Request,
} from '@nestjs/common';
import { NotifikasiService } from './notifikasi.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifikasi')
export class NotifikasiController {
    constructor(private notifikasiService: NotifikasiService) {}

    @Get()
    findAll(@Request() req) {
        return this.notifikasiService.findAllByUser(req.user.userId);
    }

    @Patch('read-all')
    markAllAsRead(@Request() req) {
        return this.notifikasiService.markAllAsRead(req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.notifikasiService.markAsRead(id, req.user.userId);
    }
}
