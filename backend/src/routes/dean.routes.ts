import { Router } from "express";
import { DeAnController } from "../controllers/dean.controller";

const router = Router();

router.get("/", DeAnController.getAll);
router.get("/empty", DeAnController.getEmpty);
// Form 1 - Đề án có nhân viên nhóm khác tham gia
router.get("/other-group/:maNhom", DeAnController.getWithOtherGroupEmployees);
router.get("/:maDA", DeAnController.getByMa);
router.post("/", DeAnController.create);
router.put("/:maDA", DeAnController.update);
router.delete("/:maDA", DeAnController.delete);

export default router;
