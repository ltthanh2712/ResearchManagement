import { Router } from "express";
import { NhanVienController } from "../controllers/nhanvien.controller";

const router = Router();

// Lấy tất cả nhóm
router.get("/", NhanVienController.getAll);
router.get("/:maNV", NhanVienController.getByMa);
router.post("/", NhanVienController.create);
router.put("/:maNV", NhanVienController.update);
router.delete("/:maNV", NhanVienController.delete);
export default router;
