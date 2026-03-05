const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Event = require('../models/Event');
const { getRedisClient } = require('../services/redis');

const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3100';

// ─── QR Code ─────────────────────────────────────────────────────────────────
// GET /qr/:tracking_id
async function getQRCode(req, res) {
  try {
    const asset = await Asset.findOne({ tracking_id: req.params.tracking_id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // QR points to the link tracking endpoint (or pixel/download depending on type)
    let url;
    if (asset.type === 'link') url = `${BASE_URL}/l/${asset.tracking_id}`;
    else if (asset.type === 'file') url = `${BASE_URL}/d/${asset.tracking_id}`;
    else url = `${BASE_URL}/p/${asset.tracking_id}.png`;

    const png = await QRCode.toBuffer(url, { type: 'png', width: 300, margin: 2 });

    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' });
    return res.send(png);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ─── SVG Badge ───────────────────────────────────────────────────────────────
// GET /badge/:tracking_id
async function getBadge(req, res) {
  try {
    const asset = await Asset.findOne({ tracking_id: req.params.tracking_id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Fetch view count
    let views = 0;
    try {
      const redis = await getRedisClient();
      const val = await redis.get(`asset:${asset.tracking_id}:views`);
      views = val ? parseInt(val) : 0;
    } catch (_) {
      views = await Event.countDocuments({ asset_id: asset._id });
    }

    const label = 'Views';
    const value = views.toLocaleString();
    const labelWidth = label.length * 7 + 10;
    const valueWidth = value.length * 8 + 10;
    const totalWidth = labelWidth + valueWidth;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="m"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></mask>
  <g mask="url(#m)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#4c65e0"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;

    res.set({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    return res.send(svg);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ─── Public Analytics JSON ────────────────────────────────────────────────────
// GET /public/:tracking_id   (no auth required)
async function getPublicAnalytics(req, res) {
  try {
    const asset = await Asset.findOne({ tracking_id: req.params.tracking_id }, '-user_id -file_url');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (!asset.public_analytics_enabled) return res.status(403).json({ message: 'Public analytics disabled for this asset' });

    const assetObjId = new mongoose.Types.ObjectId(asset._id);

    // Total views
    let total_views = 0;
    try {
      const redis = await getRedisClient();
      const val = await redis.get(`asset:${asset.tracking_id}:views`);
      total_views = val ? parseInt(val) : 0;
    } catch (_) {
      total_views = await Event.countDocuments({ asset_id: asset._id });
    }

    // Daily views (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().slice(0, 10);

    // Try to get today's count from Redis
    let todayCount = 0;
    try {
      const redis = await getRedisClient();
      const val = await redis.get(`asset:${asset.tracking_id}:daily:${today}`);
      todayCount = val ? parseInt(val) : 0;
    } catch (_) {}

    const [dailyAgg, countryAgg, referrerAgg, deviceAgg] = await Promise.all([
      Event.aggregate([
        { $match: { asset_id: assetObjId, timestamp: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { asset_id: assetObjId, country: { $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { country: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { asset_id: assetObjId, referrer: { $ne: null, $ne: '' } } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { referrer: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { asset_id: assetObjId } },
        { $group: { _id: '$device_type', count: { $sum: 1 } } },
        { $project: { device: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return res.json({
      tracking_id: asset.tracking_id,
      name: asset.name,
      type: asset.type,
      total_views,
      today_views: todayCount,
      daily_views: dailyAgg,
      countries: countryAgg,
      referrers: referrerAgg,
      device_breakdown: deviceAgg,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getQRCode, getBadge, getPublicAnalytics };
