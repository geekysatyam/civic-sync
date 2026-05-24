import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    action: {
      type: String,
      enum: ['status_change', 'assignment', 'broadcast', 'contractor_assigned', 'contractor_rated', 'moderation'],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, default: '' },
    fromValue: { type: String, default: '' },
    toValue: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ issueId: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
