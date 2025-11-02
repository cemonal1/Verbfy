import { Request, Response } from 'express';
import { FreeMaterial } from '../models/FreeMaterial';
import User, { IUser } from '../models/User';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Resolve uploads directory to an absolute path (robust across environments)
const FREE_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/free-materials');
if (!fs.existsSync(FREE_UPLOADS_DIR)) {
  try {
    fs.mkdirSync(FREE_UPLOADS_DIR, { recursive: true });
  } catch (e) {
    // Fallback: ensure base uploads exists
    const base = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    fs.mkdirSync(FREE_UPLOADS_DIR, { recursive: true });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, FREE_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export class FreeMaterialController {
  // Get all free materials with filtering
  static async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        level,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 12,
        featured
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = { isActive: true };

      if (category && category !== 'All') filter.category = category;
      if (level && level !== 'All') filter.level = level;
      if (featured === 'true') filter.isFeatured = true;
      if (search) {
        filter.$or = [
          { title: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
          { tags: { $in: [new RegExp(search as string, 'i')] } }
        ];
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const materials = await FreeMaterial.find(filter)
        .populate('uploadedBy', 'name email profileImage')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));

      const total = await FreeMaterial.countDocuments(filter);

      res.json({
        success: true,
        data: materials,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch materials' });
    }
  }

  // Get featured materials
  static async getFeaturedMaterials(req: Request, res: Response): Promise<void> {
    try {
      const materials = await FreeMaterial.find({ isActive: true, isFeatured: true })
        .populate('uploadedBy', 'name email profileImage')
        .sort({ rating: -1, downloadCount: -1 })
        .limit(6);

      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch featured materials' });
    }
  }

  // Get material by ID
  static async getMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const material = await FreeMaterial.findById(id)
        .populate('uploadedBy', 'name email profileImage');

      if (!material) {
        res.status(404).json({ success: false, message: 'Material not found' });
      return;
      }

      res.json({
        success: true,
        data: material
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch material' });
    }
  }

  // Upload new material (teachers and admins only)
  static async uploadMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const user = await User.findById(userId);
      
      if (!user || !['teacher', 'admin'].includes(user.role)) {
        res.status(403).json({ success: false, message: 'Only teachers and admins can upload materials' });
      return;
      }

      upload.single('file')(req, res, async (err) => {
        if (err) {
          res.status(400).json({ success: false, message: err.message });
      return;
        }

        if (!req.file) {
          res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
        }

        const {
          title,
          description,
          category,
          level,
          tags,
          isFeatured
        } = req.body;

        const materialData = {
          title,
          description,
          type: this.getFileType(req.file.mimetype),
          fileUrl: `/uploads/free-materials/${req.file.filename}`,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedBy: userId,
          category,
          level,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
          isFeatured: isFeatured === 'true'
        };

        const material = new FreeMaterial(materialData);
        await material.save();

        const populatedMaterial = await FreeMaterial.findById(material._id)
          .populate('uploadedBy', 'name email profileImage');

        res.status(201).json({
          success: true,
          data: populatedMaterial,
          message: 'Material uploaded successfully'
        });
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to upload material' });
    }
  }

  // Update material (only by uploader or admin)
  static async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { title, description, category, level, tags, isFeatured } = req.body;

      const material = await FreeMaterial.findById(id);
      if (!material) {
        res.status(404).json({ success: false, message: 'Material not found' });
      return;
      }

      const user = await User.findById(userId);
      if (!user || (material.uploadedBy.toString() !== userId && user.role !== 'admin')) {
        res.status(403).json({ success: false, message: 'Not authorized' });
      return;
      }

      // Update fields
      if (title) material.title = title;
      if (description) material.description = description;
      if (category) material.category = category;
      if (level) material.level = level;
      if (tags) material.tags = tags.split(',').map((tag: string) => tag.trim());
      if (isFeatured !== undefined) material.isFeatured = isFeatured;

      await material.save();

      const updatedMaterial = await FreeMaterial.findById(id)
        .populate('uploadedBy', 'name email profileImage');

      res.json({
        success: true,
        data: updatedMaterial,
        message: 'Material updated successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update material' });
    }
  }

  // Delete material (only by uploader or admin)
  static async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const material = await FreeMaterial.findById(id);
      if (!material) {
        res.status(404).json({ success: false, message: 'Material not found' });
      return;
      }

      const user = await User.findById(userId);
      if (!user || (material.uploadedBy.toString() !== userId && user.role !== 'admin')) {
        res.status(403).json({ success: false, message: 'Not authorized' });
      return;
      }

      // Delete file from filesystem
      if (material.fileUrl && fs.existsSync(material.fileUrl.substring(1))) {
        fs.unlinkSync(material.fileUrl.substring(1));
      }

      await FreeMaterial.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete material' });
    }
  }

  // Rate material
  static async rateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
      }

      const material = await FreeMaterial.findById(id);
      if (!material) {
        res.status(404).json({ success: false, message: 'Material not found' });
      return;
      }

      await material.updateRating(rating);

      res.json({
        success: true,
        message: 'Rating submitted successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to submit rating' });
    }
  }

  // Download material
  static async downloadMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const material = await FreeMaterial.findById(id);
      if (!material) {
        res.status(404).json({ success: false, message: 'Material not found' });
      return;
      }

      // Increment download count
      await material.incrementDownload();
      // Derive absolute file path robustly
      const fileName = path.basename(material.fileUrl || '');
      const filePath = path.join(FREE_UPLOADS_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found' });
      return;
      }

      res.download(filePath, material.title + path.extname(filePath));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to download material' });
    }
  }

  // Get material categories
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await FreeMaterial.distinct('category');
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  }

  // Get material levels
  static async getLevels(req: Request, res: Response): Promise<void> {
    try {
      const levels = await FreeMaterial.distinct('level');
      res.json({
        success: true,
        data: levels
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch levels' });
    }
  }

  // Helper method to determine file type
  private static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word')) return 'document';
    if (mimeType.includes('powerpoint')) return 'presentation';
    return 'document';
  }
}