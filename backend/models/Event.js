const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: null },
  country: { type: String, default: null },
  referrer: { type: String, default: null },
  user_agent: { type: String, default: null },
  device_type: { type: String, enum: ['mobile', 'desktop', 'tablet'], default: 'desktop' },
});

eventSchema.index({ asset_id: 1, timestamp: -1 });

module.exports = mongoose.model('Event', eventSchema);
