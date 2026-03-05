const router = require('express').Router();
const { trackPixel, trackLink, trackDownload } = require('../controllers/trackingController');
const { getQRCode, getBadge, getPublicAnalytics } = require('../controllers/publicController');

// Pixel: /p/:tracking_id  or  /p/:tracking_id.png
router.get('/p/:tracking_id', trackPixel);

// Link: /l/:tracking_id
router.get('/l/:tracking_id', trackLink);

// File download: /d/:tracking_id
router.get('/d/:tracking_id', trackDownload);

// QR code PNG: /qr/:tracking_id
router.get('/qr/:tracking_id', getQRCode);

// Dynamic SVG badge: /badge/:tracking_id
router.get('/badge/:tracking_id', getBadge);

// Public analytics (no auth): /public/:tracking_id
router.get('/public/:tracking_id', getPublicAnalytics);

module.exports = router;
