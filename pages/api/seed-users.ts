import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Hash passwords
        const adminPassword = await bcrypt.hash('adminTJA', 10);
        const user1Password = await bcrypt.hash('userTJA1', 10);
        const user2Password = await bcrypt.hash('userTJA2', 10);
        const user3Password = await bcrypt.hash('userTJA3', 10);

        // Create users
        const users = [
            {
                username: 'admin',
                password: adminPassword,
                role: UserRole.ADMIN
            },
            {
                username: 'user1',
                password: user1Password,
                role: UserRole.USER
            },
            {
                username: 'user2',
                password: user2Password,
                role: UserRole.USER
            },
            {
                username: 'user3',
                password: user3Password,
                role: UserRole.USER
            }
        ];

        // Clear existing users first
        await prisma.user.deleteMany({});

        // Create new users
        const createdUsers = await Promise.all(
            users.map(user => 
                prisma.user.create({
                    data: user
                })
            )
        );

        res.status(200).json({ 
            message: 'Users seeded successfully',
            users: createdUsers.map(user => ({
                id: user.id,
                username: user.username,
                role: user.role
            }))
        });

    } catch (error) {
        console.error('User seeding error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
