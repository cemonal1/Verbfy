import { Request, Response } from 'express';
import { Material, IMaterial } from '../models/Material';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Allowed file types and their MIME types
const ALLOWED_TYPES = {
  'pdf': ['application/pdf'],
  'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  'video': ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'],
  'document': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
};

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Generate unique filename
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

// Get file type from MIME type
const getFileType = (mimeType: string): string => {
  for (const [type, mimeTypes] of Object.entries(ALLOWED_TYPES)) {
    if (mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return 'document'; // Default fallback
};

// Validate file type
const isValidFileType = (mimeType: string): boolean => {
  return Object.values(ALLOWED_TYPES).flat().includes(mimeType);
};

// Upload material
export const uploadMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const { originalname, filename, mimetype, size } = req.file;
    const { tags, description, isPublic } = req.body;
    const uploaderId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Validate file size
    if (size > MAX_FILE_SIZE) {
      // Delete uploaded file
      await unlinkAsync(req.file.path);
      res.status(400).json({
        success: false,
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
      return;
    }

    // Validate file type
    if (!isValidFileType(mimetype)) {
      // Delete uploaded file
      await unlinkAsync(req.file.path);
      res.status(400).json({
        success: false,
        message: 'File type not allowed'
      });
      return;
    }

    // Determine file type
    const fileType = getFileType(mimetype);

    // Create material record
    const material = new Material({
      uploaderId,
      originalName: originalname,
      savedName: filename,
      type: fileType,
      mimeType: mimetype,
      fileSize: size,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      role: userRole,
      description: description || '',
      isPublic: isPublic === 'true'
    });

    await material.save();

    res.status(201).json({
      success: true,
      data: {
        _id: material._id,
        originalName: material.originalName,
        type: material.type,
        previewURL: `/api/materials/${material._id}/preview`,
        fileSize: material.fileSize,
        tags: material.tags,
        description: material.description,
        isPublic: material.isPublic,
        createdAt: material.createdAt
      },
      message: 'Material uploaded successfully'
    });

  } catch (error) {
    console.error('Upload material error:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload material'
    });
  }
};

// Get materials with filters
export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uploaderId, type, tags, isPublic, page = 1, limit = 10 } = req.query;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    // Build filter object
    const filter: any = {};

    // Filter by uploader
    if (uploaderId) {
      filter.uploaderId = uploaderId;
    }

    // Filter by type
    if (type) {
      const types = (type as string).split(',');
      filter.type = { $in: types };
    }

    // Filter by tags
    if (tags) {
      const tagArray = (tags as string).split(',').map((tag: string) => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Filter by public/private
    if (isPublic !== undefined) {
      filter.isPublic = isPublic === 'true';
    }

    // Role-based filtering
    if (userRole === 'student') {
      // Students can only see public materials or their own
      filter.$or = [
        { isPublic: true },
        { uploaderId: userId },
        { createdBy: userId }
      ];
    } else if (userRole === 'teacher') {
      // Teachers can see public materials, their own, and materials from their students
      filter.$or = [
        { isPublic: true },
        { uploaderId: userId },
        { createdBy: userId },
        { role: 'student' } // Teachers can see student materials
      ];
    }
    // Admins can see everything (no additional filter)

    // Pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Execute query with pagination
    const materials = await Material.find(filter)
      .populate('uploaderId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    // Get total count for pagination
    const total = await Material.countDocuments(filter);

    // Return shape aligned with integration tests
    res.json({
      materials,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials'
    });
  }
};

// Get material by ID
export const getMaterialById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    const material = await Material.findById(id).populate('uploaderId', 'name email role');

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    // Check access permissions
    const ownerId = material.uploaderId?.toString() || material.createdBy?.toString();
    const canAccess = material.isPublic || 
                     ownerId === userId ||
                     userRole === 'admin' ||
                     (userRole === 'teacher' && material.role === 'student');

    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: material,
      message: 'Material retrieved successfully'
    });

  } catch (error) {
    console.error('Get material by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve material'
    });
  }
};

// Preview material file
export const previewMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    const material = await Material.findById(id);

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    // Check access permissions
    const ownerId = material.uploaderId?.toString() || material.createdBy?.toString();
    const canAccess = material.isPublic || 
                     ownerId === userId ||
                     userRole === 'admin' ||
                     (userRole === 'teacher' && material.role === 'student');

    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Ensure file-backed material
    if (!material.savedName) {
      res.status(400).json({
        success: false,
        message: 'No file available for preview'
      });
      return;
    }

    // Check if file type is previewable
    const previewableTypes = ['pdf', 'image'];
    if (!previewableTypes.includes(material.type || '')) {
      res.status(400).json({
        success: false,
        message: 'File type not previewable'
      });
      return;
    }

    // Construct file path
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    const savedName: string = material.savedName as string;
    const filePath = path.join(uploadsDir, savedName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
      return;
    }

    // Set appropriate headers
    const mime = material.mimeType || 'application/octet-stream';
    const displayName = material.originalName || material.title || savedName;
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${displayName}"`);

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Preview material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview material'
    });
  }
};

// Download material file
export const downloadMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;

    const material = await Material.findById(id);

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    // Check access permissions
    const ownerId = material.uploaderId?.toString() || material.createdBy?.toString();
    const canAccess = material.isPublic || 
                     ownerId === userId ||
                     userRole === 'admin' ||
                     (userRole === 'teacher' && material.role === 'student');

    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Ensure file-backed material
    if (!material.savedName) {
      res.status(400).json({
        success: false,
        message: 'No file available for download'
      });
      return;
    }

    // Construct file path
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    const savedName: string = material.savedName as string;
    const filePath = path.join(uploadsDir, savedName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
      return;
    }

    // Set appropriate headers for download
    const mime = material.mimeType || 'application/octet-stream';
    const displayName = material.originalName || material.title || savedName;
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${displayName}"`);

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download material'
    });
  }
};

// Create material via JSON (no file upload)
export const createJsonMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { title, description, category, cefrLevel, difficulty, content, isPublic } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const material = new Material({
      title: title.trim(),
      description: description || '',
      category,
      cefrLevel,
      difficulty,
      content,
      createdBy: userId,
      isPublic: Boolean(isPublic),
      role: (req as any).user?.role,
      tags: []
    });

    await material.save();

    res.status(201).json(material);
  } catch (error) {
    console.error('Create JSON material error:', error);
    res.status(500).json({ message: 'Failed to create material' });
  }
};

// Update material
export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tags, description, isPublic, title, category, cefrLevel, difficulty, content } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const material = await Material.findById(id);

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    // Check if user can update this material
    const ownerId = material.uploaderId?.toString() || material.createdBy?.toString();
    const canUpdate = ownerId === userId || userRole === 'admin';

    if (!canUpdate) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Update fields
    if (tags !== undefined) {
      material.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((tag: string) => tag.trim());
    }
    if (description !== undefined) {
      material.description = description;
    }
    if (isPublic !== undefined) {
      material.isPublic = isPublic === 'true' || isPublic === true;
    }
    if (title !== undefined) {
      material.title = title;
    }
    if (category !== undefined) {
      material.category = category;
    }
    if (cefrLevel !== undefined) {
      material.cefrLevel = cefrLevel;
    }
    if (difficulty !== undefined) {
      material.difficulty = difficulty;
    }
    if (content !== undefined) {
      material.content = content;
    }

    await material.save();

    // Return the updated material directly to align with tests
    res.json(material);

  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material'
    });
  }
};

// Delete material
export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const material = await Material.findById(id);

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    // Check if user can delete this material
    const ownerId = material.uploaderId?.toString() || material.createdBy?.toString();
    const canDelete = ownerId === userId || userRole === 'admin';

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Delete physical file (only if uploaded file exists)
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    if (material.savedName) {
      const filePath = path.join(uploadsDir, material.savedName);
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }
    }

    // Delete database record
    await Material.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material'
    });
  }
};

// Get user's own materials
export const getMyMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const materials = await Material.find({ uploaderId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Material.countDocuments({ uploaderId: userId });

    res.json({
      success: true,
      data: {
        materials,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      },
      message: 'Your materials retrieved successfully'
    });

  } catch (error) {
    console.error('Get my materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your materials'
    });
  }
};