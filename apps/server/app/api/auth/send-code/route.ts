import { NextResponse } from 'next/server';
import { VerificationCodeModel } from '@/src/models/VerificationCode';
import { dbConnect } from '@/src/lib/db';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
            return NextResponse.json({ error: '无效的手机号码' }, { status: 400 });
        }

        await dbConnect();

        // In a real scenario, you'd call an SMS provider here.
        // For Mock mode, we use a fixed code or log it.
        const code = '123456';
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save or update code for this phone
        await VerificationCodeModel.findOneAndUpdate(
            { phone, isUsed: false },
            { code, expiresAt, isUsed: false },
            { upsert: true, new: true }
        );

        console.log(`\n[SMS Mock] ==============================`);
        console.log(`[SMS Mock] 验证码发送至: ${phone}`);
        console.log(`[SMS Mock] 验证码内容: ${code}`);
        console.log(`[SMS Mock] ==============================\n`);

        return NextResponse.json({ success: true, message: '验证码已发送 (开发模式已打印至日志)' });
    } catch (error) {
        console.error('Send code error:', error);
        return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
    }
}
