import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../utils/logger';

const uploadLogger = createLogger('FileUpload');

const MIME_TYPE_WHITELIST = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  videos: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm'
  ]
};

const ALL_ALLOWED_MIMES = [
  ...MIME_TYPE_WHITELIST.images,
  ...MIME_TYPE_WHITELIST.documents,
  ...MIME_TYPE_WHITELIST.videos,
  ...MIME_TYPE_WHITELIST.audio
];

const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,      // 5MB
  document: 10 * 1024 * 1024,   // 10MB
  video: 100 * 1024 * 1024,     // 100MB
  audio: 20 * 1024 * 1024,      // 20MB
  default: 10 * 1024 * 1024     // 10MB
};

const getMaxSize = (mimetype: string): number => {
  if (MIME_TYPE_WHITELIST.images.includes(mimetype)) return MAX_FILE_SIZES.image;
  if (MIME_TYPE_WHITELIST.documents.includes(mimetype)) return MAX_FILE_SIZES.document;
  if (MIME_TYPE_WHITELIST.videos.includes(mimetype)) return MAX_FILE_SIZES.video;
  if (MIME_TYPE_WHITELIST.audio.includes(mimetype)) return MAX_FILE_SIZES.audio;
  return MAX_FILE_SIZES.default;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALL_ALLOWED_MIMES.includes(file.mimetype)) {
    uploadLogger.warn('File rejected: Invalid MIME type', {
      filename: file.originalname,
      mimetype: file.mimetype,
      allowedTypes: ALL_ALLOWED_MIMES
    });
    cb(new Error(`Invalid file type. Allowed types: ${ALL_ALLOWED_MIMES.join(', ')}`));
    return;
  }

  const maxSize = getMaxSize(file.mimetype);
  const ext = path.extname(file.originalname).toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.jar', '.apk'];

  if (dangerousExtensions.includes(ext)) {
    uploadLogger.warn('File rejected: Dangerous extension', {
      filename: file.originalname,
      extension: ext
    });
    cb(new Error('File type not allowed for security reasons'));
    return;
  }

  uploadLogger.info('File accepted', {
    filename: file.originalname,
    mimetype: file.mimetype,
    maxSize
  });

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZES.video,
    files: 10
  }
});

export const validateFileSize = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    next();
    return;
  }

  const maxSize = getMaxSize(req.file.mimetype);

  if (req.file.size > maxSize) {
    uploadLogger.error('File size exceeds limit', {
      filename: req.file.originalname,
      fileSize: req.file.size,
      maxSize,
      mimetype: req.file.mimetype
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(413).json({
      success: false,
      message: `File size exceeds limit. Maximum allowed: ${(maxSize / (1024 * 1024)).toFixed(2)}MB`
    });
    return;
  }

  next();
};

export const validateMultipleFiles = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.files || !Array.isArray(req.files)) {
    next();
    return;
  }

  for (const file of req.files) {
    const maxSize = getMaxSize(file.mimetype);

    if (file.size > maxSize) {
      uploadLogger.error('File size exceeds limit in batch upload', {
        filename: file.originalname,
        fileSize: file.size,
        maxSize
      });

      for (const f of req.files) {
        if (fs.existsSync(f.path)) {
          fs.unlinkSync(f.path);
        }
      }

      res.status(413).json({
        success: false,
        message: `File "${file.originalname}" exceeds size limit. Maximum: ${(maxSize / (1024 * 1024)).toFixed(2)}MB`
      });
      return;
    }
  }

  next();
};

export const singleImageUpload = upload.single('image');
export const singleFileUpload = upload.single('file');
export const multipleFilesUpload = upload.array('files', 10);
export const avatarUpload = upload.single('avatar');
export const materialUpload = upload.single('material');
