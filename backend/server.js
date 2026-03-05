require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const wsService = require('./services/websocket');

const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const trackingRoutes = require('./routes/tracking');
const analyticsRoutes = require('./routes/analytics');
const ticketRoutes   = require('./routes/tickets');

const app = express();
const server = http.createServer(app);

// Security & logging
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false, // allow cross-origin image loads (badge, QR)
}));
app.use(morgan('dev'));

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:4004',
      'https://tracklayer.xyz',
      'https://www.tracklayer.xyz',
    ],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/assets', assetRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/tickets',   ticketRoutes);
app.use('/', trackingRoutes); // /p/:id /l/:id /d/:id

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// Connect to MongoDB then start server
const PORT = process.env.PORT || 4003;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      wsService.init(server);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
