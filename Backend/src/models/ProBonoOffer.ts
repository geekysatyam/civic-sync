import mongoose from 'mongoose';

const proBonoSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    serviceLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    /** Email, phone, or full mailto:/tel: link */
    contact: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

proBonoSchema.index({ city: 1 });
export const ProBonoOffer = mongoose.model('ProBonoOffer', proBonoSchema);
