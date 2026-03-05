const Asset = require('../models/Asset');
const Event = require('../models/Event');
const { logEvent } = require('../utils/eventLogger');
const { getRedisClient } = require('../services/redis');

// 1x1 transparent PNG (base64)
const PIXEL_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

// Expired-link HTML response
const EXPIRED_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Link Expired</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f4f4f8}
.box{text-align:center;padding:40px;border-radius:12px;background:#fff;box-shadow:0 2px 20px rgba(0,0,0,.1)}
h1{font-size:2rem;color:#ef4444}p{color:#666}</style></head>
<body><div class="box"><h1>Link Expired</h1><p>This link has expired or reached its click limit.</p></div></body></html>`;

async function isExpired(asset) {
  if (asset.expires_at && new Date() > new Date(asset.expires_at)) return true;
  if (asset.max_clicks != null) {
    // Check current click count
    let views = 0;
    try {
      const redis = await getRedisClient();
      const val = await redis.get(`asset:${asset.tracking_id}:views`);
      views = val ? parseInt(val) : 0;
    } catch (_) {
      views = await Event.countDocuments({ asset_id: asset._id });
    }
    if (views >= asset.max_clicks) return true;
  }
  return false;
}

async function trackPixel(req, res) {
  try {
    const trackingId = req.params.tracking_id.replace(/\.png$/i, '');
    const asset = await Asset.findOne({ tracking_id: trackingId, type: 'pixel' });

    // Always return pixel even if not found or expired; just skip logging
    if (asset) {
      const expired = await isExpired(asset);
      if (!expired) logEvent(asset, req);
    }

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    return res.send(PIXEL_BUFFER);
  } catch (err) {
    console.error('Pixel track error:', err.message);
    res.status(500).end();
  }
}

async function trackLink(req, res) {
  try {
    const asset = await Asset.findOne({ tracking_id: req.params.tracking_id, type: 'link' });
    if (!asset) return res.status(404).send(EXPIRED_HTML);

    if (await isExpired(asset)) {
      return res.status(410).send(EXPIRED_HTML);
    }

    logEvent(asset, req);
    return res.redirect(302, asset.target_url);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function trackDownload(req, res) {
  try {
    const asset = await Asset.findOne({ tracking_id: req.params.tracking_id, type: 'file' });
    if (!asset) return res.status(404).json({ message: 'File not found' });

    if (await isExpired(asset)) {
      return res.status(410).send(EXPIRED_HTML);
    }

    logEvent(asset, req);
    return res.redirect(302, asset.file_url);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { trackPixel, trackLink, trackDownload };
