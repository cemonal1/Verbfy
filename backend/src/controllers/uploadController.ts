import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '../middleware/auth';
import mime from 'mime-types';

const bucket = process.env.S3_BUCKET || '';
const region = process.env.S3_REGION || 'us-east-1';

const s3 = new S3Client({
  region,
  credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  } : undefined,
});

export const getSignedUploadUrl = async (req: Request, res: Response) => {
  try {
    const { folder = 'uploads', fileName, contentType, contentLength } = req.query as Record<string, string>;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, message: 'fileName and contentType are required' });
    }
    // Validate content type: allow only PDF, images, mp4 videos
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }
    // Enforce size limits (bytes): PDFs <= 10MB, images <= 5MB, videos <= 100MB
    const size = parseInt(contentLength || '0', 10);
    const limit = contentType === 'application/pdf' ? 10 * 1024 * 1024 : contentType.startsWith('image/') ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    if (size > 0 && size > limit) {
      return res.status(413).json({ success: false, message: 'File too large' });
    }
    const ext = mime.extension(contentType) || 'bin';
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ACL: 'private' });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = process.env.S3_PUBLIC_URL_PREFIX ? `${process.env.S3_PUBLIC_URL_PREFIX}/${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return res.json({ success: true, data: { uploadUrl: url, key, publicUrl } });
  } catch (e) {
    console.error('getSignedUploadUrl error:', e);
    return res.status(500).json({ success: false, message: 'Failed to get upload URL' });
  }
};


