const crypto = require('crypto');
const geoip = require('geoip-lite');
const Event = require('../models/Event');
const { getRedisClient } = require('../services/redis');
const ws = require('../services/websocket');

// ─── Bot detection ───────────────────────────────────────────────────────────
const BOT_PATTERNS = /Googlebot|Bingbot|AhrefsBot|SemrushBot|DotBot|Rogerbot|curl|wget|python-requests|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|crawler|spider/i;

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_PATTERNS.test(userAgent);
}

// ─── Device detection ────────────────────────────────────────────────────────
function detectDevice(userAgent) {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

// ─── IP helpers ──────────────────────────────────────────────────────────────
function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || null;
}

function getCountry(ip) {
  if (!ip) return null;
  const lookupIp = (ip === '127.0.0.1' || ip === '::1')
    ? (process.env.DEV_TEST_IP || null)
    : ip;
  if (!lookupIp) return null;
  const geo = geoip.lookup(lookupIp);
  return geo ? geo.country : null;
}

// ─── Main logger ─────────────────────────────────────────────────────────────
async function logEvent(asset, req) {
  const user_agent = req.headers['user-agent'] || null;

  // Drop bot traffic — do not record and do not block response
  if (isBot(user_agent)) return;

  const ip = getIp(req);
  const country = getCountry(ip);
  const referrer = req.headers.referer || req.headers.referrer || null;
  const device_type = detectDevice(user_agent);
  const today = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toISOString();

  // Persist event asynchronously — do not block the response
  setImmediate(async () => {
    let totalViews = 0;

    // 1. Save event to MongoDB
    try {
      await Event.create({ asset_id: asset._id, ip, country, referrer, user_agent, device_type });
    } catch (err) {
      console.error('Event save error:', err.message);
    }

    // 2. Increment Redis counters + track unique visitor
    try {
      const redis = await getRedisClient();
      // Unique visitor fingerprint = hash of ip + user_agent
      const visitorHash = crypto
        .createHash('sha256')
        .update(`${ip || ''}:${user_agent || ''}`)
        .digest('hex');

      const results = await Promise.all([
        redis.incr(`asset:${asset.tracking_id}:views`),
        redis.incr(`asset:${asset.tracking_id}:daily:${today}`),
        redis.sAdd(`asset:${asset.tracking_id}:unique:${today}`, visitorHash),
      ]);
      totalViews = results[0];
    } catch (_) {
      // Redis unavailable — fall back to MongoDB count
      try {
        totalViews = await Event.countDocuments({ asset_id: asset._id });
      } catch (err) {
        console.error('Fallback count error:', err.message);
      }
    }

    // 3. Broadcast live update
    ws.broadcastToUser(String(asset.user_id), {
      type: 'event',
      asset_id: String(asset._id),
      tracking_id: asset.tracking_id,
      name: asset.name,
      asset_type: asset.type,
      total_views: totalViews,
      ip,
      country,
      referrer,
      user_agent,
      device_type,
      timestamp,
    });
  });
}

module.exports = { logEvent, isBot, detectDevice };
