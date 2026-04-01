import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  anonymousId: string;
  googleId?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  nickname?: string;
  nicknameSet: boolean;
  createdAt: Date;
  postCount: number;
  reportCount: number;
  isBanned: boolean;
}

const UserSchema = new Schema<IUser>({
  anonymousId:  { type: String, required: true, unique: true },
  googleId:     { type: String, sparse: true },
  email:        { type: String, sparse: true },
  displayName:  { type: String },
  avatar:       { type: String },
  nickname:     { type: String, sparse: true, unique: true },
  nicknameSet:  { type: Boolean, default: false },
  createdAt:    { type: Date, default: Date.now },
  postCount:    { type: Number, default: 0 },
  reportCount:  { type: Number, default: 0 },
  isBanned:     { type: Boolean, default: false },
});

export default mongoose.model<IUser>('User', UserSchema);