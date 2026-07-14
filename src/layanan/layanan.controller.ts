import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LayananService } from './layanan.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('layanan')
export class LayananController {
    constructor(private layananService: LayananService) { }

    @Get()
    findAll() {
        return this.layananService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.layananService.findOne(id);
    }
}