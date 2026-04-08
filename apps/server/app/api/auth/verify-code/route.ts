import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { VerificationCodeModel } from '@/src/models/VerificationCode';
import { UserModel } from '@/src/models/User';
import { dbConnect } from '@/src/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'arctic-fresh-secret-key-2026';

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: '手机号和验证码不能为空' }, { status: 400 });
        }

        await dbConnect();

        // 1. Verify code
        const verification = await VerificationCodeModel.findOne({
            phone,
            code,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        });

        if (!verification) {
            return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
        }

        // 2. Mark code as used
        verification.isUsed = true;
        await verification.save();

        // 3. Find or create user
        let user = await UserModel.findOne({ phone });
        if (!user) {
            user = await UserModel.create({
                phone,
                nickname: `用户_${phone.slice(-4)}`,
            });
        }

        // 4. Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // 5. Generate JWT
        const token = jwt.sign(
            { userId: user._id, phone: user.phone },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user._id,
                phone: user.phone,
                nickname: user.nickname,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error('Verify code error:', error);
        return NextResponse.json({ error: '登录失败' }, { status: 500 });
    }
}
