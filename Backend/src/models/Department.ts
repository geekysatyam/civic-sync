import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    category: {
      type: String,
      enum: ['roads', 'water', 'parks', 'electricity', 'hazards', 'sanitation', 'public_safety'],
      required: true,
    },
    avgResolutionDays: { type: Number, default: 5 },
    slaCompliance: { type: Number, default: 85 },
    openIssues: { type: Number, default: 0 },
    resolvedIssues: { type: Number, default: 0 },
    headUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
