import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({ name: String, quote: String }, { _id: false });

const storyArticleSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    city: { type: String, required: true },
    coverImageUrl: String,
    shortDescription: String,
    fullContent: String,
    citizenQuotes: [quoteSchema],
    outcomeStats: {
      issuesFixed: Number,
      volunteersInvolved: Number,
      daysToResolve: Number,
    },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StoryArticle = mongoose.model('StoryArticle', storyArticleSchema);
