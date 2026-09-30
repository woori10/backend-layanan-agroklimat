import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('super_admin')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get('unit-teknis/list')
    getUnitTeknis() {
        return this.usersService.getUnitTeknis();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status_akun') status_akun: string,
    ) {
        return this.usersService.updateStatus(id, status_akun);
    }

    @Get(':id/credential')
    getCredential(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.getCredential(id);
    }

    @Post(':id/generate-credential')
    generateCredential(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.generateCredential(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }
}