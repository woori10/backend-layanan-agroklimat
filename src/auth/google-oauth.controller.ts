import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import * as express from 'express';
import { google } from 'googleapis';

@Controller('auth/google')
export class GoogleOauthController {
    @Get('login')
    login(@Res() res: express.Response) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        if (
            !clientId || clientId === 'your_client_id.apps.googleusercontent.com' ||
            !clientSecret || clientSecret === 'your_client_secret' ||
            !redirectUri
        ) {
            throw new BadRequestException('Google OAuth client credentials are not configured in .env yet.');
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline', // requests refresh token
            prompt: 'consent',     // forces consent screen to guarantee refresh token is returned
            scope: ['https://www.googleapis.com/auth/drive'],
        });

        return res.redirect(url);
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Res() res: express.Response) {
        if (!code) {
            throw new BadRequestException('Authorization code missing');
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        try {
            const { tokens } = await oauth2Client.getToken(code);
            const refreshToken = tokens.refresh_token;

            if (!refreshToken) {
                return res.send(`
                    <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; line-height: 1.5;">
                        <h2 style="color: #dc2626;">OAuth 2.0 Success but Refresh Token Missing</h2>
                        <p>Google did not return a refresh token. This usually happens if you already authorized this application previously.</p>
                        <p>To fix this:</p>
                        <ol>
                            <li>Go to your <a href="https://myaccount.google.com/connections" target="_blank" style="color: #2563eb; text-decoration: underline;">Google Account Connections page</a>.</li>
                            <li>Find your app and click <b>Remove Access / Delete connection</b>.</li>
                            <li>Re-visit <a href="/auth/google/login" style="color: #2563eb; text-decoration: underline;">/auth/google/login</a> to log in and authorize again.</li>
                        </ol>
                    </div>
                `);
            }

            return res.send(`
                <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; line-height: 1.5; border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 4rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h2 style="color: #10b981; margin-top: 0;">OAuth 2.0 Authorization Successful! 🎉</h2>
                    <p>Successfully authenticated with your personal Google Account.</p>
                    <p>Please copy the <b>Refresh Token</b> below and paste it into your backend <code>.env</code> file:</p>
                    
                    <div style="background-color: #f1f5f9; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.95rem; word-break: break-all; border: 1px solid #cbd5e1; user-select: all;">
                        GOOGLE_REFRESH_TOKEN="${refreshToken}"
                    </div>

                    <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #64748b;">After saving the token in <code>.env</code>, remember to restart your NestJS backend server to apply the changes.</p>
                </div>
            `);
        } catch (error: any) {
            return res.status(500).send(`
                <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; line-height: 1.5;">
                    <h2 style="color: #dc2626;">Authentication Failed</h2>
                    <p>Failed to retrieve tokens from Google:</p>
                    <pre style="background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto;">${error.message || error}</pre>
                    <p><a href="/auth/google/login" style="color: #2563eb; text-decoration: underline;">Try again</a></p>
                </div>
            `);
        }
    }
}
