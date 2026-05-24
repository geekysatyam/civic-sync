import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'fix_confirmed',
        'sla_breach',
        'broadcast',
        'volunteer_reminder',
        'rank_up',
        'audit_ping',
        'community_resolution',
        'super_vote_reset',
        'escalation',
        'assignment',
        'contractor_update',
      ],
      required: true,
    },
    title: String,
    message: String,
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
