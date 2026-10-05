import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleAuth } from '../config/google-auth';

@Injectable()
export class GoogleDriveUploadService {
    private readonly logger = new Logger(GoogleDriveUploadService.name);
    private drive;
    private folderCache = new Map<string, string>();
    private cacheLoadedTime = 0;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000;

    constructor() {
        const auth = getGoogleAuth(['https://www.googleapis.com/auth/drive']);
        this.drive = google.drive({ version: 'v3', auth });
    }

    private normalizeName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[/\\_&()-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async getFolderIdForLayanan(folderName: string, slug?: string): Promise<string> {
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!rootFolderId) {
            this.logger.warn('GOOGLE_DRIVE_FOLDER_ID tidak dikonfigurasi di environment variables');
            return '';
        }

        const normTarget = this.normalizeName(folderName);
        const normSlug = slug ? this.normalizeName(slug) : '';
        const now = Date.now();

        // 1. Cek cache
        if (now - this.cacheLoadedTime < this.CACHE_TTL_MS && this.folderCache.has(normTarget)) {
            return this.folderCache.get(normTarget)!;
        }

        try {
            // Ambil subfolder di dalam folder utama Google Drive
            const res = await this.drive.files.list({
                q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name)',
                spaces: 'drive',
                pageSize: 100,
            });

            const driveFolders = res.data.files || [];
            this.folderCache.clear();
            for (const f of driveFolders) {
                if (f.name && f.id) {
                    this.folderCache.set(this.normalizeName(f.name), f.id);
                }
            }
            this.cacheLoadedTime = now;

            // Cek kecocokan nama folder manual yang dibuat user (exact normalized)
            if (this.folderCache.has(normTarget)) {
                return this.folderCache.get(normTarget)!;
            }

            // Cek kecocokan berdasarkan slug jika ada
            if (normSlug && this.folderCache.has(normSlug)) {
                return this.folderCache.get(normSlug)!;
            }

            // Cek kecocokan parsial (misal nama folder manual user sedikit berbeda)
            for (const [cachedNormName, id] of this.folderCache.entries()) {
                if (normTarget.includes(cachedNormName) || cachedNormName.includes(normTarget)) {
                    return id;
                }
                if (normSlug && (cachedNormName.includes(normSlug) || normSlug.includes(cachedNormName))) {
                    return id;
                }
            }

            // Jika folder belum ada sama sekali, buatkan otomatis
            this.logger.log(`Folder "${folderName}" belum ditemukan di Google Drive, membuat folder baru otomatis...`);
            const createRes = await this.drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [rootFolderId],
                },
                fields: 'id',
            });

            const newFolderId = createRes.data.id;
            this.folderCache.set(normTarget, newFolderId);
            return newFolderId;
        } catch (error: any) {
            this.logger.error(`Error mencari atau membuat subfolder di Google Drive: ${error.message}`);
            return rootFolderId;
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        options?: {
            customFileName?: string;
            folderName?: string;
            slug?: string;
        }
    ): Promise<string> {
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        let targetFolderId = rootFolderId;

        if (options?.folderName) {
            targetFolderId = await this.getFolderIdForLayanan(options.folderName, options.slug);
        }

        const fileName = options?.customFileName || `${Date.now()}-${file.originalname}`;

        const response = await this.drive.files.create({
            requestBody: {
                name: fileName,
                parents: targetFolderId ? [targetFolderId] : undefined,
            },
            media: {
                mimeType: file.mimetype,
                body: Readable.from(file.buffer),
            },
            fields: 'id',
        });

        const fileId = response.data.id;

        // Set permission supaya file bisa diakses lewat link (read-only untuk siapa saja yang punya link)
        try {
            await this.drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
        } catch (permErr: any) {
            this.logger.warn(`Gagal set permission 'anyone' untuk file ${fileId}: ${permErr.message}`);
        }

        return `https://drive.google.com/uc?id=${fileId}`;
    }
}