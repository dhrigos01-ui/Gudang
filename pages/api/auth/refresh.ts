import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: 'Server not configured' });
    return;
  }

  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
  const refreshToken = match ? decodeURIComponent(match[1]) : null;
  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, secret) as { id: string; role: UserRole };
    const newAccessToken = jwt.sign({ id: decoded.id, role: decoded.role }, secret, { expiresIn: '1d' });
    res.status(200).json({ token: newAccessToken });
  } catch (e) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}


