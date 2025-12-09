const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

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

// basic health check
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "API running" });
});

// TODO: Stripe webhooks
// app.post("/webhooks/stripe", ...)

// TODO: Admin routes (protected with Google OAuth)
// app.get("/admin/logs", ...)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
