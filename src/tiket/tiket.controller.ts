import { Body, Controller, Get, Post, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { TiketService } from './tiket.service';
import { CreateTiketDto } from './dto/create-tiket.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tiket')
export class TiketController {
    constructor(private tiketService: TiketService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateTiketDto) {
        return this.tiketService.create(req.user.userId, dto);
    }

    @Get()
    findAll(@Request() req) {
        return this.tiketService.findAllByUser(req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.tiketService.findOneByUser(req.user.userId, id);
    }
}