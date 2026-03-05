const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  createAsset,
  getAssets,
  getAsset,
  deleteAsset,
  uploadFile,
  togglePublicAnalytics,
} = require('../controllers/assetController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(auth);

// /upload MUST come before /:id to avoid route shadowing
router.post('/upload', upload.single('file'), uploadFile);

router.post('/', createAsset);
router.get('/', getAssets);
router.get('/:id', getAsset);
router.delete('/:id', deleteAsset);
router.patch('/:id/toggle-public', togglePublicAnalytics);

module.exports = router;
