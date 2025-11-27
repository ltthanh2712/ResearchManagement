import { Router } from "express";
import { ThamGiaController } from "../controllers/thamgia.controller";

const router = Router();

// Get all tham gia
router.get("/", ThamGiaController.getAll);

// Get specific tham gia by MaNV and MaDA
router.get("/:maNV/:maDA", ThamGiaController.getById);

// Create new tham gia
router.post("/", ThamGiaController.create);

// Update existing tham gia
router.put("/:maNV/:maDA", ThamGiaController.update);

// Delete tham gia
router.delete("/:maNV/:maDA", ThamGiaController.delete);

// Move single ThamGia to new site (with NhanVien migration)
router.post("/:maNV/:maDA/move", ThamGiaController.moveToSite);

// Move all ThamGia of a project to new site
router.post("/project/:maDA/move", ThamGiaController.moveProjectToSite);

// Update MaNV in ThamGia (direct update)
router.put("/:maNV/:maDA/update-manv", ThamGiaController.updateMaNV);

export default router;
