const { WebSocketServer, OPEN } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

let wss = null;

// Map: userId -> Set of ws clients
const userSockets = new Map();

function init(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via ?token=<jwt>
    const { query } = url.parse(req.url, true);
    const token = query.token;

    if (!token) {
      ws.close(1008, 'Missing token');
      return;
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      ws.close(1008, 'Invalid token');
      return;
    }

    ws._userId = userId;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(ws);

    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('close', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) userSockets.delete(userId);
      }
    });

    ws.on('error', (err) => console.error('WS error:', err.message));
  });

  console.log('WebSocket server attached');
}

/**
 * Broadcast a live event to all open sockets belonging to userId.
 */
function broadcastToUser(userId, payload) {
  const set = userSockets.get(String(userId));
  if (!set) return;
  const msg = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === OPEN) ws.send(msg);
  }
}

module.exports = { init, broadcastToUser };
