import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';

@Controller('faq')
export class FaqController {
    constructor(private readonly faqService: FaqService) {}

    // Public endpoint: untuk landing page (hanya faq yang aktif)
    @Get()
    findPublic() {
        return this.faqService.findPublic();
    }

    // Admin endpoint: untuk Super Admin melihat semua data faq
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Get('admin')
    findAll() {
        return this.faqService.findAll();
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.faqService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Post()
    create(@Body() dto: CreateFaqDto) {
        return this.faqService.create(dto);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqDto) {
        return this.faqService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin')
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.faqService.remove(id);
    }
}
