import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const verificationCodeSchema = new Schema(
    {
        phone: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        code: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ['login', 'register'],
            default: 'login',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Automatically delete when expired
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Keep only one valid code per phone
verificationCodeSchema.index({ phone: 1, createdAt: -1 });

export type VerificationCodeDocument = InferSchemaType<typeof verificationCodeSchema> & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
};

export const VerificationCodeModel =
    (models.VerificationCode as Model<VerificationCodeDocument>) ||
    model<VerificationCodeDocument>('VerificationCode', verificationCodeSchema);
