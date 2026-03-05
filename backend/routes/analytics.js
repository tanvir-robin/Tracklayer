const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAnalytics, getAllCounts, getRecentEvents } = require('../controllers/analyticsController');

router.use(auth);
router.get('/', getAllCounts);                // GET /analytics  — all asset counts
router.get('/recent-events', getRecentEvents); // GET /analytics/recent-events
router.get('/:asset_id', getAnalytics);       // GET /analytics/:id

module.exports = router;
