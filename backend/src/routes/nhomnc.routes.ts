import { Router } from "express";
import { NhomNCController } from "../controllers/nhomnc.controller";

const router = Router();

// Lấy danh sách phòng từ SiteRouting
router.get("/phong/list", NhomNCController.getPhongList);

// Lấy tất cả nhóm
router.get("/", NhomNCController.getAll);

// Lấy nhóm theo MaNhom
router.get("/:maNhom", NhomNCController.getByMa);

// Thêm nhóm mới
router.post("/", NhomNCController.create);

// Cập nhật nhóm
router.put("/:maNhom", NhomNCController.update);

// Xóa nhóm
router.delete("/:maNhom", NhomNCController.delete);

export default router;
