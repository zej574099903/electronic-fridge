import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const userSchema = new Schema(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        nickname: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'banned'],
            default: 'active',
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
};

export const UserModel =
    (models.User as Model<UserDocument>) ||
    model<UserDocument>('User', userSchema);
