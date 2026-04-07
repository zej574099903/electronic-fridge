import { InferSchemaType, Model, Schema, model, models } from 'mongoose';

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['ingredient', 'fruit', 'drink', 'dessert', 'snack', 'leftover', 'prepared', 'other'],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'expired', 'eaten', 'discarded'],
      default: 'active',
    },
    expireAt: {
      type: String,
      trim: true,
    },
    expiresOn: {
      type: Date,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    quantityUnit: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type ItemDocument = InferSchemaType<typeof itemSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const ItemModel = (models.Item as Model<ItemDocument>) || model<ItemDocument>('Item', itemSchema);
