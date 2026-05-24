import mongoose from 'mongoose';

const ghostAuditSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    scheduledAt: { type: Date, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'passed', 'recurred'], default: 'pending' },
    respondedAt: Date,
  },
  { timestamps: true }
);

export const GhostAudit = mongoose.model('GhostAudit', ghostAuditSchema);
