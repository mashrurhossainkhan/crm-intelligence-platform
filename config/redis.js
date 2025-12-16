require("dotenv").config();

const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // recommended for BullMQ
};

module.exports = { redisConnection };
