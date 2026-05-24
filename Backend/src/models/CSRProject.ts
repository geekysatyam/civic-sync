import mongoose from 'mongoose';

const csrProjectSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    title: { type: String, default: '' },
    city: { type: String, required: true },
    upvoteCount: { type: Number, default: 0 },
    governmentDeclinedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'forwarded', 'sponsored', 'funded'],
      default: 'pending',
    },
    sponsoredBy: { type: String, default: '' },
    forwardedAt: Date,
    fundingAmount: Number,
  },
  { timestamps: true }
);

export const CSRProject = mongoose.model('CSRProject', csrProjectSchema);
