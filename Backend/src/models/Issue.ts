import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    url: String,
    type: { type: String, enum: ['before', 'after'] },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const broadcastSchema = new mongoose.Schema(
  {
    message: String,
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const pledgeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    type: { type: String, enum: ['sweat', 'tools'] },
    item: String,
  },
  { _id: true }
);

const communityResolutionSchema = new mongoose.Schema(
  {
    photo: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { _id: false }
);

const ghostAuditEmbedSchema = new mongoose.Schema(
  {
    scheduledAt: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    response: { type: String, enum: ['still_good', 'recurred'] },
    respondedAt: Date,
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    suggestedSolution: { type: String, default: '' },
    category: {
      type: String,
      enum: ['roads', 'water', 'parks', 'electricity', 'hazards', 'sanitation', 'public_safety'],
      required: true,
    },
    city: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    photos: [photoSchema],
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: [
        'pending',
        'open',
        'under_review',
        'acknowledged',
        'in_progress',
        'community_resolved',
        'resolved',
        'recurred',
        'red_alert',
      ],
      default: 'open',
    },
    isRedAlert: { type: Boolean, default: false },
    redAlertAcknowledgedAt: Date,
    redAlertUnacknowledgedFlag: { type: Boolean, default: false },
    aiSummary: String,
    aiSeverity: { type: Number, min: 1, max: 5 },
    aiCostEstimate: String,
    aiResourceEstimate: mongoose.Schema.Types.Mixed,
    priorityScore: { type: Number, default: 0 },
    contractorRating: { type: Number, min: 1, max: 5 },
    contractorRatingComment: { type: String, default: '' },
    isTranslated: { type: Boolean, default: false },
    originalLanguage: String,
    translatedText: String,
    isAbuseFlagged: { type: Boolean, default: false },
    abuseReviewStatus: { type: String, enum: ['pending', 'cleared', 'confirmed'], default: 'pending' },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    acknowledgedAt: Date,
    resolvedAt: Date,
    resolutionTimeDays: Number,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    slaDeadline: Date,
    slaBreached: { type: Boolean, default: false },
    broadcasts: [broadcastSchema],
    comments: [commentSchema],
    pledges: [pledgeSchema],
    communityResolution: communityResolutionSchema,
    ghostAudit: ghostAuditEmbedSchema,
    isFakeFlagged: { type: Boolean, default: false },
    assignedContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contractorWorkStatus: {
      type: String,
      enum: ['unassigned', 'assigned', 'on_site', 'completed'],
      default: 'unassigned',
    },
    contractorUpdates: [
      {
        note: String,
        workStatus: String,
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdByName: String,
      },
    ],
  },
  { timestamps: true }
);

issueSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1, category: 1 });
issueSchema.index({ city: 1, status: 1 });
export const Issue = mongoose.model('Issue', issueSchema);
