const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Event = require('../models/Event');
const { getRedisClient } = require('../services/redis');

/**
 * GET /analytics
 * Returns total_views for every asset belonging to the user (for dashboard pre-load)
 */
async function getAllCounts(req, res) {
  try {
    const assets = await Asset.find({ user_id: req.user.id }, 'tracking_id name type');
    let redis = null;
    try { redis = await getRedisClient(); } catch (_) {}

    const counts = await Promise.all(
      assets.map(async (a) => {
        let total_views = 0;
        try {
          if (redis) {
            const val = await redis.get(`asset:${a.tracking_id}:views`);
            total_views = val ? parseInt(val) : 0;
          }
          if (!redis || total_views === 0) {
            total_views = await Event.countDocuments({ asset_id: a._id });
          }
        } catch (_) {
          total_views = await Event.countDocuments({ asset_id: a._id });
        }
        return { asset_id: String(a._id), total_views };
      })
    );

    return res.json(counts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const asset = await Asset.findOne({ _id: req.params.asset_id, user_id: req.user.id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const assetObjId = new mongoose.Types.ObjectId(asset._id);
    const today = new Date().toISOString().slice(0, 10);

    // Total views from Redis (fast counter)
    let total_views = 0;
    let unique_visitors = 0;
    try {
      const redis = await getRedisClient();
      const val = await redis.get(`asset:${asset.tracking_id}:views`);
      total_views = val ? parseInt(val) : 0;
      // Unique visitors today from Redis set
      unique_visitors = await redis.sCard(`asset:${asset.tracking_id}:unique:${today}`);
    } catch (_) {
      total_views = await Event.countDocuments({ asset_id: asset._id });
      // Fall back to distinct IPs from MongoDB
      const uniqueIPs = await Event.distinct('ip', { asset_id: assetObjId });
      unique_visitors = uniqueIPs.filter(Boolean).length;
    }

    // Daily views (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [dailyAgg, referrerAgg, countryAgg, deviceAgg] = await Promise.all([
      Event.aggregate([
        { $match: { asset_id: assetObjId, timestamp: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { asset_id: assetObjId, referrer: { $ne: null } } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { referrer: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { asset_id: assetObjId, country: { $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { country: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { asset_id: assetObjId } },
        { $group: { _id: '$device_type', count: { $sum: 1 } } },
        { $project: { device: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return res.json({
      asset_id: asset._id,
      tracking_id: asset.tracking_id,
      name: asset.name,
      type: asset.type,
      expires_at: asset.expires_at,
      max_clicks: asset.max_clicks,
      total_views,
      unique_visitors,
      daily_views: dailyAgg,
      top_referrers: referrerAgg,
      countries: countryAgg,
      device_breakdown: deviceAgg,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /analytics/recent-events
 * Returns the 100 most recent events across all user's assets
 */
async function getRecentEvents(req, res) {
  try {
    const assets = await Asset.find({ user_id: req.user.id }, '_id name type');
    const assetMap = {};
    assets.forEach((a) => { assetMap[a._id.toString()] = a; });
    const assetIds = assets.map((a) => a._id);

    const events = await Event.find({ asset_id: { $in: assetIds } })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    const result = events.map((ev) => {
      const asset = assetMap[ev.asset_id?.toString()];
      return {
        _id: ev._id,
        timestamp: ev.timestamp,
        ip: ev.ip,
        country: ev.country,
        referrer: ev.referrer,
        user_agent: ev.user_agent,
        asset_id: ev.asset_id,
        name: asset?.name || 'Unknown',
        asset_type: asset?.type || 'pixel',
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getAnalytics, getAllCounts, getRecentEvents };
