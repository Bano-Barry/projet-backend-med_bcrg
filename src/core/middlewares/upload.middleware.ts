/**
 * @file upload.middleware.ts
 * @description Middleware Multer configure pour le televersement securise de documents medicaux (PDF, JPG, PNG <= 10Mo).
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../../core/errors';
import { env } from '../../config/env';

const uploadTempDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads', 'temp');
if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadTempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        'Format de fichier non autorise. Formats acceptes : PDF, JPEG, PNG, WEBP (jusqu\'a 10 Mo)'
      )
    );
  }
};

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo
  },
  fileFilter,
});
