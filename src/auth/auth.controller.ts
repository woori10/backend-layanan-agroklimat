import { Body, Controller, Post, Get, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LoginPegawaiDto, ForgotPasswordDto, ResetPasswordDto, VerifyCurrentPasswordDto, ChangePasswordDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto, @Request() req: any) {
        const clientUrl = req.headers?.origin || (req.headers?.referer ? new URL(req.headers.referer).origin : undefined);
        return this.authService.register(dto, clientUrl);
    }

    @Get('verify-email')
    verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
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

    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto, @Request() req: any) {
        const clientUrl = req.headers?.origin || (req.headers?.referer ? new URL(req.headers.referer).origin : undefined);
        return this.authService.forgotPassword(dto, clientUrl);
    }

    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-current-password')
    verifyCurrentPassword(@Request() req, @Body() dto: VerifyCurrentPasswordDto) {
        return this.authService.verifyCurrentPassword(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, dto);
    }
}