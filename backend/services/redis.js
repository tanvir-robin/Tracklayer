const { createClient } = require('redis');

let client = null;

async function getRedisClient() {
  if (client && client.isOpen) return client;

  client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  return client;
}

module.exports = { getRedisClient };
