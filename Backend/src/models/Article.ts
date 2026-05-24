import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({ name: String, quote: String }, { _id: false });

const articleSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    city: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    fullContent: { type: String, default: '' },
    coverImageUrl: { type: String, default: '' },
    citizenQuotes: [quoteSchema],
    outcomeStats: {
      issuesFixed: Number,
      volunteersInvolved: Number,
      daysToResolve: Number,
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderationNote: { type: String, default: '' },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    publishedAt: Date,
  },
  { timestamps: true }
);

articleSchema.index({ moderationStatus: 1, publishedAt: -1 });
articleSchema.index({ authorId: 1 });

export const Article = mongoose.model('Article', articleSchema);
