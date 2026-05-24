import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: String,
    quantityNeeded: Number,
    pledges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const volunteerEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pledgedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const volunteerDriveSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    city: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    scheduledDate: { type: Date, required: true },
    items: [itemSchema],
    volunteers: [volunteerEntrySchema],
    status: { type: String, enum: ['open', 'scheduled', 'completed'], default: 'open' },
    isProBono: { type: Boolean, default: false },
    tradesPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const VolunteerDrive = mongoose.model('VolunteerDrive', volunteerDriveSchema);
