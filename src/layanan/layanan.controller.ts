import { Controller, Get, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LayananService } from './layanan.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';

@Controller('layanan')
export class LayananController {
    constructor(private layananService: LayananService) { }

    // Public endpoint: untuk landing page (hanya layanan yang aktif)
    @Get()
    findPublic() {
        return this.layananService.findPublic();
    }

    // Admin endpoint: untuk Super Admin melihat semua layanan (aktif dan non-aktif)
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Get('admin')
    findAll() {
        return this.layananService.findAll();
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.layananService.findBySlug(slug);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.layananService.findOne(id);
    }

    // Admin endpoint: toggle atau update status is_active layanan
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('is_active') is_active: boolean,
    ) {
        return this.layananService.updateStatus(id, is_active);
    }
}