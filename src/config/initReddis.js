const { createClient } = require("redis");
const { store } = require("../services/authService");

async function initRedis() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    const client = createClient({ url: redisUrl });
    client.on("error", (err) => console.error("Redis error:", err));

    await client.connect();
    store.client = client;
    store.isRedis = true;

    console.log("✅ Connected to Redis");
    return client;
  } catch (err) {
    console.warn("⚠️ Redis unavailable, using in-memory store:", err.message);
    return null;
  }
}

module.exports = { initRedis };
