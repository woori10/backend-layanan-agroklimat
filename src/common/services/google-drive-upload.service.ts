import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleAuth } from '../config/google-auth';

@Injectable()
export class GoogleDriveUploadService {
    private drive;

    constructor() {
        const auth = getGoogleAuth(['https://www.googleapis.com/auth/drive']);
        this.drive = google.drive({ version: 'v3', auth });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        const response = await this.drive.files.create({
            requestBody: {
                name: `${Date.now()}-${file.originalname}`,
                parents: [folderId],
            },
            media: {
                mimeType: file.mimetype,
                body: Readable.from(file.buffer),
            },
            fields: 'id',
        });

        const fileId = response.data.id;

        // Set permission supaya file bisa diakses lewat link (read-only untuk siapa saja yang punya link)
        await this.drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return `https://drive.google.com/uc?id=${fileId}`;
    }
}