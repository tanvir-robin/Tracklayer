const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['pixel', 'link', 'file'], required: true },
  tracking_id: { type: String, required: true, unique: true },
  target_url: { type: String, default: null },
  file_url: { type: String, default: null },
  expires_at: { type: Date, default: null },
  max_clicks: { type: Number, default: null },
  public_analytics_enabled: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Asset', assetSchema);
