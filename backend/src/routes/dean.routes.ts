import { Router } from "express";
import { DeAnController } from "../controllers/dean.controller";

const router = Router();

router.get("/", DeAnController.getAll);
router.get("/empty", DeAnController.getEmpty);
router.get("/:maDA", DeAnController.getByMa);
router.post("/", DeAnController.create);
router.put("/:maDA", DeAnController.update);
router.delete("/:maDA", DeAnController.delete);

export default router;
