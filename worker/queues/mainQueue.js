const { Queue } = require("bullmq");
const { redisConnection } = require("../../config/redis");

const mainQueue = new Queue("main-jobs", { connection: redisConnection });

module.exports = { mainQueue };
