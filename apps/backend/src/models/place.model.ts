import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  googlePlaceId: string;  // Google ka unique ID har place ka
  name: string;           // "Blue Tokai Coffee"
  address: string;        // "Lodhi Colony, New Delhi"
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  category: string;       // cafe, college, market etc
  postCount: number;      // kitne posts hain is place pe
  createdAt: Date;
}

const PlaceSchema = new Schema<IPlace>({
  googlePlaceId: { type: String, required: true, unique: true },
  name:          { type: String, required: true },
  address:       { type: String },
  location: {
    type:        { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  category:  { type: String },
  postCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Yeh line CRITICAL hai — bina iske location search kaam nahi karega
// 2dsphere = MongoDB ko batata hai ki yeh GPS coordinates hain
PlaceSchema.index({ location: '2dsphere' });

export default mongoose.model<IPlace>('Place', PlaceSchema);