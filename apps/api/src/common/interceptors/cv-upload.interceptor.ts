import { BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage, memoryStorage } from "multer";

export const CVUploadInterceptor = FileInterceptor('file', {
    storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${file.originalname}-${uniqueSuffix}`);
        }

    }),
    // storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new BadRequestException('Accept pdf format only'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
});