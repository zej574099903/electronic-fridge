import mongoose from 'mongoose';

declare global {
  var __mongooseConnectionPromise__: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalThis.__mongooseConnectionPromise__) {
    globalThis.__mongooseConnectionPromise__ = mongoose.connect(mongoUri, {
      dbName: 'electronic-fridge',
      bufferCommands: false,
    });
  }

  try {
    return await globalThis.__mongooseConnectionPromise__;
  } catch (error) {
    globalThis.__mongooseConnectionPromise__ = undefined;
    throw error;
  }
}
export const dbConnect = connectToDatabase;
