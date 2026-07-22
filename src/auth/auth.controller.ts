import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LoginPegawaiDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('login/pegawai')
    loginPegawai(@Body() dto: LoginPegawaiDto) {
        return this.authService.loginPegawai(dto);
    }

    @Post('logout')
    logout() {
        return this.authService.logout();
    }
}