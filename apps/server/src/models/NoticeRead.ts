import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const noticeReadSchema = new Schema(
  {
    noticeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    readAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type NoticeReadDocument = InferSchemaType<typeof noticeReadSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const NoticeReadModel =
  (models.NoticeRead as Model<NoticeReadDocument>) || model<NoticeReadDocument>('NoticeRead', noticeReadSchema);
