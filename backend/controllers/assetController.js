const shortid = require('shortid');
const Asset = require('../models/Asset');
const { uploadToMinIO } = require('../services/storage');

async function createAsset(req, res) {
  try {
    const { name, type, target_url, expires_at, max_clicks } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'name and type are required' });
    if (!['pixel', 'link', 'file'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
    if (type === 'link' && !target_url) return res.status(400).json({ message: 'target_url required for link type' });

    const tracking_id = shortid.generate();
    const asset = await Asset.create({
      user_id: req.user.id,
      name,
      type,
      tracking_id,
      target_url: target_url || null,
      expires_at: expires_at ? new Date(expires_at) : null,
      max_clicks: max_clicks ? parseInt(max_clicks) : null,
    });
    return res.status(201).json(asset);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAssets(req, res) {
  try {
    const assets = await Asset.find({ user_id: req.user.id }).sort({ created_at: -1 });
    return res.json(assets);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAsset(req, res) {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    return res.json(asset);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteAsset(req, res) {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const file_url = await uploadToMinIO(req.file.buffer, req.file.originalname, req.file.mimetype);
    const tracking_id = shortid.generate();

    const asset = await Asset.create({
      user_id: req.user.id,
      name,
      type: 'file',
      tracking_id,
      file_url,
    });
    return res.status(201).json(asset);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function togglePublicAnalytics(req, res) {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    asset.public_analytics_enabled = !asset.public_analytics_enabled;
    await asset.save();
    return res.json({ public_analytics_enabled: asset.public_analytics_enabled });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { createAsset, getAssets, getAsset, deleteAsset, uploadFile, togglePublicAnalytics };
