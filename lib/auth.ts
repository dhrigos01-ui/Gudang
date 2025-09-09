import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
// FIX: Import UserRole from local types definition instead of @prisma/client.
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables');
}

export interface AuthenticatedRequest extends NextApiRequest {
    user: {
        id: string;
        role: UserRole;
    };
}

type ApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const protect = (handler: ApiHandler, allowedMethods: HttpMethod[], requiredRole?: UserRole) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const method = req.method as HttpMethod;
        if (!allowedMethods.includes(method)) {
            return res.status(405).json({ message: 'Method Not Allowed' });
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
            
            if (requiredRole && decoded.role !== requiredRole) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

            const authReq = req as AuthenticatedRequest;
            authReq.user = decoded;
            
            return handler(authReq, res);
        } catch (error) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
};