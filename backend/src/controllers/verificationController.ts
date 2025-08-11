import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import VerificationToken from '../models/VerificationToken';
import { sendEmail } from '../utils/email';
import bcrypt from 'bcryptjs';

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const record = await VerificationToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // mark verified via isApproved for students or add flag (reuse isActive)
    user.isActive = true;
    await user.save();
    await record.deleteOne();
    return res.json({ success: true, message: 'Email verified' });
  } catch (e) {
    console.error('verifyEmail error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If the email exists, a reset link was sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30m
    await VerificationToken.create({ userId: user._id, token, expiresAt });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendEmail(user.email, 'Reset your Verbfy password', `
      <p>Hello ${user.name},</p>
      <p>Use the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 30 minutes.</p>
    `);
    return res.json({ success: true, message: 'If the email exists, a reset link was sent' });
  } catch (e) {
    console.error('requestPasswordReset error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password are required' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const record = await VerificationToken.findOne({ token });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();
    await record.deleteOne();
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error('resetPassword error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


