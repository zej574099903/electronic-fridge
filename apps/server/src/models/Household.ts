import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const householdSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerUserId: {
      type: String,
      required: true,
      trim: true,
      default: 'default-user',
    },
    inviteCode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'archived'],
      default: 'active',
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type HouseholdDocument = InferSchemaType<typeof householdSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const HouseholdModel =
  (models.Household as Model<HouseholdDocument>) || model<HouseholdDocument>('Household', householdSchema);
