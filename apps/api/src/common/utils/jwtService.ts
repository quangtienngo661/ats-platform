import { Role } from '@ats-platform/types';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const generateAccessToken = (userId: string, role: Role): string => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

const generateRefreshToken = (userId: string, role: Role): string => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
}

const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
        return null;
    }
}

export { generateAccessToken, generateRefreshToken, verifyToken }; 