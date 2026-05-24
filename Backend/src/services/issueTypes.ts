import type { Types } from 'mongoose';

export type IssueDocShape = {
  _id: Types.ObjectId;
  category: string;
  coordinates: { lat: number; lng: number };
  isDuplicate?: boolean;
};
