const Redis = require("ioredis");

const uri = 'redis://default:rbIJtMqNvzRShj86Nis2O5QQSHsvYvhL@redis-12560.c212.ap-south-1-1.ec2.redns.redis-cloud.com:12560';

const client = new Redis(uri, {
  reconnectOnError: (err) => {
    if (err && err.message.includes("ECONNRESET")) {
      console.log("Redis connection lost. Reconnecting...");
      return true;
    }
    return false;
  },
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
  keepAlive: 30000,
});

// Event listeners
client.on("connect", () => {
  console.log("Connected to Redis Cloud!");
});

client.on("ready", () => {
  console.log("Redis is ready to accept commands");
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

client.on("close", () => {
  console.warn("Redis connection closed");
});

client.on("reconnecting", (delay) => {
  console.log(`Redis reconnecting in ${delay}ms`);
});

setInterval(() => {
  client.ping().catch((err) => {
    console.error("Redis ping failed:", err);
  });
}, 20000);

module.exports = client;
