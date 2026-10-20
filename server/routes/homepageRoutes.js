import express from "express";
import {
  getPublicHomepageLayout,
  getHomepageLayout,
  updateHomepageLayout,
} from "../controllers/homepageController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/public", getPublicHomepageLayout);
router.get("/", protect, authorize("admin"), getHomepageLayout);
router.put("/", protect, authorize("admin"), updateHomepageLayout);

export default router;
