require("dotenv").config();
const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");

// This is our main queue name for now
const QUEUE_NAME = "main-jobs";

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log("Processing job:", job.name, job.data);

    // TODO:
    // - handle Stripe -> CRM sync jobs
    // - handle AI cleaning jobs
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job failed: ${job.id}`, err);
});
