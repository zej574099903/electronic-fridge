import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const noticeReadSchema = new Schema(
  {
    householdId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    noticeId: {
      type: String,
      required: true,
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

noticeReadSchema.index({ householdId: 1, noticeId: 1 }, { unique: true });

export type NoticeReadDocument = InferSchemaType<typeof noticeReadSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const NoticeReadModel =
  (models.NoticeRead as Model<NoticeReadDocument>) || model<NoticeReadDocument>('NoticeRead', noticeReadSchema);
