// src/app.ts
import dotenv from "dotenv";
// ============================
// LOAD ENV NGAY ĐẦU TIÊN
// ============================
dotenv.config();

import express from "express";
import cors from "cors";
import { siteConfig, getConnection } from "./config/db";
import "./config/fault-tolerance"; // Khởi tạo fault tolerance
import nhomNCRouter from "./routes/nhomnc.routes";
import deAnRouter from "./routes/dean.routes";
import nhanVienRouter from "./routes/nhanvien.routes";
import thamGiaRouter from "./routes/thamgia.routes";
import healthRouter from "./routes/health.routes";

// ============================
// KIỂM TRA CONFIG NGAY ĐẦU
// ============================
console.log("SiteC database config:", siteConfig.siteC.config.database);
console.log("SiteC user:", siteConfig.siteC.config.user);
console.log("SiteC password:", siteConfig.siteC.config.password);
console.log("ENV POSTGRES_PASSWORD:", process.env.POSTGRES_PASSWORD);
console.log("ENV POSTGRES_PASSWORD:", process.env.POSTGRES_PASSWORD);

// ============================
// KHỞI TẠO EXPRESS
// ============================
const app = express();
const port = Number(process.env.PORT) || 8080;

// CORS middleware - QUAN TRỌNG cho frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8080"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json());

app.use("/nhomnc", nhomNCRouter);
app.use("/dean", deAnRouter);
app.use("/nhanvien", nhanVienRouter);
app.use("/thamgia", thamGiaRouter);
app.use("/health", healthRouter);

// Root route with fault tolerance info
app.get("/", (req, res) => {
  res.json({
    message: "Research Management API is running! 🚀",
    version: "1.0.0",
    faultTolerance: "Enabled ✅",
    healthCheck: "/health/system",
    endpoints: {
      health: "/health/*",
      nhanvien: "/nhanvien/*",
      dean: "/dean/*",
      nhomnc: "/nhomnc/*",
      thamgia: "/thamgia/*",
    },
  });
});

// ============================
// START SERVER
// ============================
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running at http://0.0.0.0:${port}`)
);
