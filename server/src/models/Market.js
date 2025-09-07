import mongoose from 'mongoose';

const probabilitySchema = new mongoose.Schema({
  outcome: { type: String, required: true },
  price: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

const marketSchema = new mongoose.Schema({
  marketId: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  slug: String,
  category: { type: String, default: 'Other' },
  probabilities: [probabilitySchema],
  volume: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const priceHistorySchema = new mongoose.Schema({
  marketId: { type: String, required: true, index: true },
  outcome: { type: String, required: true },
  price: { type: Number, required: true, min: 0, max: 1 },
  timestamp: { type: Date, default: Date.now, index: true }
});

const movementSchema = new mongoose.Schema({
  marketId: { type: String, required: true, index: true },
  outcome: String,
  changePercent: { type: Number, required: true },
  oldPrice: { type: Number, required: true },
  newPrice: { type: Number, required: true },
  detectedAt: { type: Date, default: Date.now, index: true }
});

// Add indexes for better query performance
marketSchema.index({ updatedAt: -1 });
marketSchema.index({ category: 1 });
priceHistorySchema.index({ marketId: 1, timestamp: -1 });
movementSchema.index({ detectedAt: -1 });

export const Market = mongoose.model('Market', marketSchema);
export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
export const Movement = mongoose.model('Movement', movementSchema);
