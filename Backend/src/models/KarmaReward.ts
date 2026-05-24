import mongoose from 'mongoose';

const karmaRewardSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    businessName: { type: String, required: true },
    city: { type: String, required: true },
    discountPercent: { type: Number, default: 0 },
    karmaCost: { type: Number, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const KarmaReward = mongoose.model('KarmaReward', karmaRewardSchema);
