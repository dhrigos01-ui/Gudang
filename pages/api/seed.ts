import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const adminUserExists = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (!adminUserExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    role: UserRole.ADMIN,
                },
            });
        }

        const regularUserExists = await prisma.user.findUnique({ where: { username: 'user' } });
        if (!regularUserExists) {
            const hashedPassword = await bcrypt.hash('user', 10);
            await prisma.user.create({
                data: {
                    username: 'user',
                    password: hashedPassword,
                    role: UserRole.USER,
                },
            });
        }
        
        res.status(200).json({ message: 'Default users seeded successfully.' });
    } catch (error) {
        console.error('Seeding error:', error);
        res.status(500).json({ message: 'Error seeding database', error: (error as Error).message });
    }
}