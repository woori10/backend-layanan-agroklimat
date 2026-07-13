import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LoginPegawaiDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

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

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, dto.new_password);
    }
}