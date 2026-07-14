import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryUploadService {
    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'auto', // otomatis deteksi PDF/gambar
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                },
            );

            Readable.from(file.buffer).pipe(uploadStream);
        });
    }
}