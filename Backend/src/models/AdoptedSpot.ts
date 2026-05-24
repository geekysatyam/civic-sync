import mongoose from 'mongoose';

const adoptedSpotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
    city: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    adoptedBy: { type: mongoose.Schema.Types.Mixed },
    committedSince: { type: Date, default: Date.now },
    lastCleanedAt: Date,
    upkeepLog: [
      {
        date: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    recognitionBadgeAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdoptedSpot = mongoose.model('AdoptedSpot', adoptedSpotSchema);
