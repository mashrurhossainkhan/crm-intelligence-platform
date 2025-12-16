require("dotenv").config();
const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const pool = require("../config/db");

const QUEUE_NAME = "main-jobs";

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name === "stripe:event") {
      const { eventId } = job.data;

      // Mark event as processed (simple v1)
      await pool.query(
        "UPDATE stripe_events SET processed = TRUE, processed_at = NOW() WHERE event_id = $1",
        [eventId]
      );

      // Add log
      await pool.query(
        "INSERT INTO sync_logs (source, status, message, meta) VALUES ($1,$2,$3,$4)",
        ["stripe", "success", "Processed stripe event", { eventId }]
      );

      return { ok: true };
    }

    return { ok: true, note: "Unknown job type" };
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => console.log("✅ Job completed:", job.id));
worker.on("failed", (job, err) => console.error("❌ Job failed:", job?.id, err));
