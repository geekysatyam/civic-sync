import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [pollOptionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    city: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    coordinates: { lat: Number, lng: Number },
    radiusMeters: { type: Number, default: 5000 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Poll = mongoose.model('Poll', pollSchema);
