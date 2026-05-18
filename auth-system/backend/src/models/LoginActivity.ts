import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginActivity extends Document {
  userId: mongoose.Types.ObjectId;
  ip: string;
  browser: string;
  os: string;
  device: string;
  status: 'success' | 'failed' | 'suspicious';
  reason?: string;
  createdAt: Date;
}

const LoginActivitySchema = new Schema<ILoginActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ip: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Unknown' },
    status: { type: String, enum: ['success', 'failed', 'suspicious'], required: true },
    reason: { type: String },
  },
  { timestamps: true }
);

export const LoginActivity = mongoose.model<ILoginActivity>('LoginActivity', LoginActivitySchema); 