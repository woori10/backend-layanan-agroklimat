import { google } from 'googleapis';
import * as path from 'path';

export function getGoogleAuth(scopes: string[]): any {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (
        refreshToken &&
        clientId &&
        clientId !== 'your_client_id.apps.googleusercontent.com' &&
        clientSecret &&
        clientSecret !== 'your_client_secret'
    ) {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );
        oauth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        return oauth2Client;
    }

    const keyFilePath = path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS!);

    return new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes,
    });
}