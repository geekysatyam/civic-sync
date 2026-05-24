import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  { badgeId: { type: String, required: true }, earnedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const serviceHoursEntry = new mongoose.Schema(
  { eventId: String, hours: Number, date: Date },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    profileComplete: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ['citizen', 'mayor', 'state_admin', 'admin', 'contractor', 'department_head'],
      required: true,
    },
    /** Set when role === department_head — links to their managed Department */
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    /** Set when role === contractor — matches issue category (electricity, water, etc.) */
    contractorCategory: {
      type: String,
      enum: ['roads', 'water', 'parks', 'electricity', 'hazards', 'sanitation', 'public_safety', ''],
      default: '',
    },
    contractorLabel: { type: String, default: '' },
    contractorAverageRating: { type: Number, default: 0 },
    contractorTotalRatings: { type: Number, default: 0 },
    createdByMayor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    city: { type: String, default: '' },
    neighborhood: { type: String, default: '' },
    phone: { type: String, default: '' },
    phoneVerified: { type: Boolean, default: false },
    verificationMethod: { type: String, enum: ['', 'otp', 'manual'], default: '' },
    rank: {
      type: String,
      enum: ['civic_scout', 'block_captain', 'neighborhood_advocate', 'city_guardian', 'district_champion', 'state_legend'],
      default: 'civic_scout',
    },
    xp: { type: Number, default: 0 },
    karmaPoints: { type: Number, default: 0 },
    specialtyBadges: [badgeSchema],
    superVoteUsedAt: Date,
    isTrustedReporter: { type: Boolean, default: false },
    volunteerHours: { type: Number, default: 0 },
    solutionsImplemented: { type: Number, default: 0 },
    issuesPosted: { type: Number, default: 0 },
    serviceHoursLog: [serviceHoursEntry],
    adoptedSpots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdoptedSpot' }],
    avatarUrl: { type: String, default: '' },
    karmaRedemptions: [
      {
        rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'KarmaReward' },
        couponCode: { type: String, required: true },
        businessName: String,
        rewardDescription: String,
        redeemedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
