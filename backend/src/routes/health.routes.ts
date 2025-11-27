// src/routes/health.routes.ts
import { Router } from "express";
import { HealthController } from "../controllers/health.controller";

const router = Router();

// Lấy trạng thái tất cả sites
router.get("/sites", HealthController.getSiteHealth);

// Test fault tolerance
router.get("/test", HealthController.testFaultTolerance);

// Test tìm kiếm nhân viên với fault tolerance
router.get("/test/employee/:maNV", HealthController.testEmployeeSearch);

// Kiểm tra tổng quan system health
router.get("/system", HealthController.getSystemHealth);

export default router;
