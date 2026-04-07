import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const householdMemberSchema = new Schema(
  {
    householdId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['owner', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'left'],
      default: 'active',
    },
    nickname: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

householdMemberSchema.index({ householdId: 1, userId: 1 }, { unique: true });

export type HouseholdMemberDocument = InferSchemaType<typeof householdMemberSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const HouseholdMemberModel =
  (models.HouseholdMember as Model<HouseholdMemberDocument>) ||
  model<HouseholdMemberDocument>('HouseholdMember', householdMemberSchema);
