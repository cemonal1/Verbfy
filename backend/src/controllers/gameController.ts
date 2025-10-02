import { Request, Response } from 'express';
import { Game } from '../models/Game';

export const listGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = '', category, level } = req.query as any;
    const q: any = {};
    if (category) q.category = category;
    if (level) q.level = level;
    if (search) q.$text = { $search: String(search) };
    const games = await Game.find(q).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: games });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to list games' });
  }
};

export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, level, thumbnailUrl, gameUrl } = req.body || {};
    if (!title || !gameUrl) {
      res.status(400).json({ success: false, message: 'title and gameUrl are required' });
      return;
    }
    if (typeof title !== 'string' || typeof gameUrl !== 'string') {
      res.status(400).json({ success: false, message: 'invalid payload' });
      return;
    }
    // very basic domain allow-list for iframe safety
    const allowed = (process.env.ALLOWED_FRAME_SRC || '').split(',').map(s => s.trim()).filter(Boolean);
    try {
      const url = new URL(gameUrl);
      if (allowed.length && !allowed.some(d => url.hostname.endsWith(d))) {
        res.status(400).json({ success: false, message: 'gameUrl domain not allowed' });
      return;
      }
    } catch {
      res.status(400).json({ success: false, message: 'invalid gameUrl' });
      return;
    }
    const game = await Game.create({ title, description, category, level, thumbnailUrl, gameUrl });
    res.status(201).json({ success: true, data: game });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create game' });
  }
};

export const deleteGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Game.findByIdAndDelete(id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete game' });
  }
};


