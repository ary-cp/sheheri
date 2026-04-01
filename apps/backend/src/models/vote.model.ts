import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  userId: string;                    // kis user ne vote kiya
  postId: mongoose.Types.ObjectId;   // kis post pe vote kiya
  value: 1 | -1;                     // 1 = upvote, -1 = downvote
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>({
  userId: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  value:  { type: Number, enum: [1, -1], required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ek user ek post pe sirf ek baar vote kar sakta hai
// Yeh index duplicate votes rokta hai — database level pe
VoteSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model<IVote>('Vote', VoteSchema);
