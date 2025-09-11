import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role as UserRole },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );

        // Issue refresh token (longer expiry) in HttpOnly cookie
        const refreshToken = jwt.sign(
            { id: user.id, role: user.role as UserRole },
            process.env.JWT_SECRET!,
            { expiresIn: '14d' }
        );

        const isProd = process.env.NODE_ENV === 'production';
        const cookie = `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${14 * 24 * 60 * 60}; SameSite=Lax; ${isProd ? 'Secure;' : ''}`;
        (res as NextApiResponse).setHeader('Set-Cookie', cookie);

        const userResponse = {
            id: user.id,
            username: user.username,
            role: user.role,
        };

        res.status(200).json({ token, user: userResponse });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}