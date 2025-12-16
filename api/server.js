const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
const Stripe = require("stripe");
const pool = require("../config/db");
const { mainQueue } = require("../worker/queues/mainQueue");
const errorHandler = require('./middleware/errorHandler');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// session for Google OAuth (we’ll configure later)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
// error handler MUST be last


app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, // raw buffer
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Stripe signature verify failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Save raw event to DB (idempotent)
      await pool.query(
        `INSERT INTO stripe_events (event_id, type, payload)
         VALUES ($1, $2, $3)
         ON CONFLICT (event_id) DO NOTHING`,
        [event.id, event.type, event]
      );

      // Enqueue a job for worker
      await mainQueue.add(
        "stripe:event",
        { eventId: event.id, type: event.type },
        { attempts: 5, backoff: { type: "exponential", delay: 2000 } }
      );

      return res.json({ received: true });
    } catch (dbErr) {
      console.error("DB/Queue error:", dbErr);
      return res.status(500).json({ error: "Failed to store event" });
    }
  }
);

// basic health check
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "API running" });
});

const pool = require("../config/db"); // adjust if your db.js is inside config

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// TODO: Stripe webhooks
// app.post("/webhooks/stripe", ...)

// TODO: Admin routes (protected with Google OAuth)
// app.get("/admin/logs", ...)
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
