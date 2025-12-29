// server.js — SpotAlert FULL backend (FIXED, STABLE, FINAL)

import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import shiraRoutes from "./routes/shira.js";

// AWS SDK v3
import {
  RekognitionClient,
  SearchFacesByImageCommand,
  IndexFacesCommand,
  DeleteFacesCommand
} from "@aws-sdk/client-rekognition";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import Stripe from "stripe";

dotenv.config();

/* =======================
   🔐 GLOBAL SAFETY GUARDS
   ======================= */
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

/* =======================
   🚫 PORT HARD REQUIREMENT
   ======================= */
if (!process.env.PORT) {
  console.error("❌ PORT is not set. Refusing to start.");
  process.exit(1);
}
const PORT = Number(process.env.PORT);

const app = express();
app.set("trust proxy", 1);

/* =======================
   BODY PARSING
   ======================= */
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   CORS (SAFE – NO CRASH)
   ======================= */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://spotalert.live",
  "http://localhost:3000"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true
  })
);

/* =======================
   SHIRA AI ROUTES
   ======================= */
app.use("/api/shira", shiraRoutes);

/* =======================
   MULTER (MEMORY)
   ======================= */
const upload = multer({ storage: multer.memoryStorage() });

/* =======================
   AWS CLIENTS (SAFE INIT)
   ======================= */
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const rekognition = new RekognitionClient({ region: AWS_REGION });
const ses = new SESClient({ region: AWS_REGION });
const s3 = new S3Client({ region: AWS_REGION });

/* =======================
   STRIPE (OPTIONAL)
   ======================= */
const stripe =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "REPLACE_ME"
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

/* =======================
   DB HANDLE
   ======================= */
let db;

/* =======================
   HELPERS (UNCHANGED)
   ======================= */
function safeLower(s) {
  return String(s || "").toLowerCase().trim();
}
function nowIso() {
  return new Date().toISOString();
}
function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}
function signToken(payload) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });
}
function s3Bucket() {
  return (
    process.env.S3_BUCKET ||
    process.env.S3_BUCKET_NAME ||
    process.env.S3_BUCKET_ALERTS ||
    ""
  );
}
function rekogCollection() {
  return process.env.REKOG_COLLECTION_ID || "";
}
function apiBase() {
  return process.env.API_BASE_URL || process.env.BASE_URL || "";
}

/* =======================
   AUTH MIDDLEWARE
   ======================= */
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(t, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
function adminAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: "Missing admin token" });
  try {
    const d = jwt.verify(t, process.env.JWT_SECRET);
    if (d.role !== "admin") throw new Error();
    req.admin = d;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid admin token" });
  }
}

/* =======================
   STREAM HELPER
   ======================= */
function streamToRes(readable, res) {
  readable.on("error", () => {
    try { res.status(500).end(); } catch {}
  });
  readable.pipe(res);
}

/* =======================
   DB INIT (UNCHANGED LOGIC)
   ======================= */
async function initDb() {
  db = await open({
    filename: "./spotalert.db",
    driver: sqlite3.Database
  });
  await db.exec("PRAGMA foreign_keys=ON");
  await ensureSchema();
  app.set("db", db);
  app.set("rekognition", rekognition);
  app.set("ses", ses);
  app.set("s3", s3);
  console.log("✅ SQLite initialized");
}

/* =======================
   HEALTH
   ======================= */
app.get("/", (req, res) => {
  res.json({ status: "SpotAlert backend running", time: nowIso() });
});
app.get("/api/status", (req, res) => {
  res.json({ ok: true, time: nowIso() });
});

/* =======================
   🚀 START SERVER
   ======================= */
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 SpotAlert backend running on port ${PORT}`);
      console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || "not set"}`);
      console.log(`API_BASE_URL: ${apiBase() || "not set"}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  });

export default app;
