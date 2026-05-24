import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    serial: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    holderName: { type: String, required: true },
    city: { type: String, required: true },
    rank: { type: String, required: true },
    volunteerHours: { type: Number, default: 0 },
    solutionsImplemented: { type: Number, default: 0 },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model('Certificate', certificateSchema);
