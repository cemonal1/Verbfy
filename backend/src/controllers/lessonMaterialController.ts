import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LessonMaterial, ILessonMaterial } from '../models/LessonMaterial';
import { Reservation } from '../models/Reservation';

// Upload a new lesson material
export const uploadMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      type, 
      fileUrl, 
      thumbnailUrl, 
      fileSize, 
      mimeType,
      lessonType,
      lessonLevel,
      tags,
      isPublic = false 
    } = req.body;

    const uploadedBy = req.user!.id;

    // Validate required fields
    if (!title || !type || !fileUrl || !fileSize || !mimeType) {
      return res.status(400).json({ 
        message: 'title, type, fileUrl, fileSize, and mimeType are required' 
      });
    }

    // Validate type
    const validTypes = ['document', 'video', 'audio', 'image', 'presentation', 'worksheet', 'quiz'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid type. Must be one of: ' + validTypes.join(', ') 
      });
    }

    // Create the material
    const material = new LessonMaterial({
      title,
      description,
      type,
      fileUrl,
      thumbnailUrl,
      fileSize,
      mimeType,
      uploadedBy,
      lessonType,
      lessonLevel,
      tags: tags || [],
      isPublic
    });

    await material.save();

    // Populate uploader details
    await material.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'Material uploaded successfully',
      material: {
        id: material._id,
        title: material.title,
        type: material.type,
        fileUrl: material.fileUrl,
        uploadedBy: material.uploadedBy,
        lessonType: material.lessonType,
        lessonLevel: material.lessonLevel,
        createdAt: material.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error uploading material:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to upload material' 
    });
  }
};

// Get materials by teacher
export const getTeacherMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.id;
    const { lessonType, lessonLevel, type } = req.query;

    let query: any = { uploadedBy: teacherId };

    if (lessonType) query.lessonType = lessonType;
    if (lessonLevel) query.lessonLevel = lessonLevel;
    if (type) query.type = type;

    const materials = await LessonMaterial.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      materials: materials.map(material => ({
        id: material._id,
        title: material.title,
        description: material.description,
        type: material.type,
        fileUrl: material.fileUrl,
        thumbnailUrl: material.thumbnailUrl,
        lessonType: material.lessonType,
        lessonLevel: material.lessonLevel,
        tags: material.tags,
        isPublic: material.isPublic,
        downloadCount: material.downloadCount,
        rating: material.rating,
        uploadedBy: material.uploadedBy,
        createdAt: material.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Error fetching teacher materials:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch materials' 
    });
  }
};

// Get public materials
export const getPublicMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonType, lessonLevel, type, tags } = req.query;

    let query: any = { isPublic: true };

    if (lessonType) query.lessonType = lessonType;
    if (lessonLevel) query.lessonLevel = lessonLevel;
    if (type) query.type = type;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const materials = await LessonMaterial.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ rating: -1, downloadCount: -1 });

    res.json({
      materials: materials.map(material => ({
        id: material._id,
        title: material.title,
        description: material.description,
        type: material.type,
        fileUrl: material.fileUrl,
        thumbnailUrl: material.thumbnailUrl,
        lessonType: material.lessonType,
        lessonLevel: material.lessonLevel,
        tags: material.tags,
        downloadCount: material.downloadCount,
        rating: material.rating,
        uploadedBy: material.uploadedBy,
        createdAt: material.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Error fetching public materials:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch materials' 
    });
  }
};

// Get material by ID
export const getMaterialById = async (req: AuthRequest, res: Response) => {
  try {
    const { materialId } = req.params;
    const userId = req.user!.id;

    const material = await LessonMaterial.findById(materialId)
      .populate('uploadedBy', 'name email');

    if (!material) {
      return res.status(404).json({ 
        message: 'Material not found' 
      });
    }

    // Check if user can access this material
    const isOwner = material.uploadedBy._id.toString() === userId;
    const isPublic = material.isPublic;

    if (!isOwner && !isPublic) {
      return res.status(403).json({ 
        message: 'Access denied to this material' 
      });
    }

    // Increment download count
    material.downloadCount += 1;
    await material.save();

    res.json({
      material: {
        id: material._id,
        title: material.title,
        description: material.description,
        type: material.type,
        fileUrl: material.fileUrl,
        thumbnailUrl: material.thumbnailUrl,
        lessonType: material.lessonType,
        lessonLevel: material.lessonLevel,
        tags: material.tags,
        isPublic: material.isPublic,
        downloadCount: material.downloadCount,
        rating: material.rating,
        uploadedBy: material.uploadedBy,
        createdAt: material.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error fetching material:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch material' 
    });
  }
};

// Update material
export const updateMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { materialId } = req.params;
    const userId = req.user!.id;
    const { title, description, lessonType, lessonLevel, tags, isPublic } = req.body;

    const material = await LessonMaterial.findById(materialId);

    if (!material) {
      return res.status(404).json({ 
        message: 'Material not found' 
      });
    }

    // Check if user owns this material
    if (material.uploadedBy.toString() !== userId) {
      return res.status(403).json({ 
        message: 'You can only update your own materials' 
      });
    }

    // Update fields
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (lessonType) material.lessonType = lessonType;
    if (lessonLevel) material.lessonLevel = lessonLevel;
    if (tags) material.tags = tags;
    if (isPublic !== undefined) material.isPublic = isPublic;

    await material.save();

    res.json({
      message: 'Material updated successfully',
      material: {
        id: material._id,
        title: material.title,
        description: material.description,
        type: material.type,
        lessonType: material.lessonType,
        lessonLevel: material.lessonLevel,
        tags: material.tags,
        isPublic: material.isPublic,
        updatedAt: material.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error updating material:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update material' 
    });
  }
};

// Delete material
export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const { materialId } = req.params;
    const userId = req.user!.id;

    const material = await LessonMaterial.findById(materialId);

    if (!material) {
      return res.status(404).json({ 
        message: 'Material not found' 
      });
    }

    // Check if user owns this material
    if (material.uploadedBy.toString() !== userId) {
      return res.status(403).json({ 
        message: 'You can only delete your own materials' 
      });
    }

    // Check if material is being used in any reservations
    const reservationsUsingMaterial = await Reservation.find({
      materials: materialId
    });

    if (reservationsUsingMaterial.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete material that is being used in lessons' 
      });
    }

    await LessonMaterial.findByIdAndDelete(materialId);

    res.json({
      message: 'Material deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting material:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete material' 
    });
  }
}; 