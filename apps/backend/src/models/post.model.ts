import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  content: string;
  authorId: string;
  placeId: mongoose.Types.ObjectId;
  googlePlaceId: string;
  placeName: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  upvotes: number;
  downvotes: number;
  hotScore: number;
  reportCount: number;
  isHidden: boolean;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  content:       { type: String, required: true, maxlength: 1000 },
  authorId:      { type: String, required: true },
  placeId:       { type: Schema.Types.ObjectId, ref: 'Place', required: true },
  googlePlaceId: { type: String, required: true },
  placeName:     { type: String, required: true },
  location: {
    type:        { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  upvotes:     { type: Number, default: 0 },
  downvotes:   { type: Number, default: 0 },
  hotScore:    { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  isHidden:    { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
});

PostSchema.index({ location: '2dsphere' });
PostSchema.index({ googlePlaceId: 1, hotScore: -1 });
PostSchema.index({ hotScore: -1, createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);