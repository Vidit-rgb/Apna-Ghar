import express from "express";
import upload from "../middleware/upload.js";


import {
  addPG,
  getMyPGs,
  getAllPGs,
  deletePG,
  updatePG,
  getPGById,
} from "../controllers/pgController.js";

const router = express.Router();

// Add PG
router.post("/add", upload.array("images", 6), addPG);

// Get Owner PGs
router.get("/mypgs/:ownerId", getMyPGs);

// Get All PGs (For Users)
router.get("/all", getAllPGs);

// Update PG
router.put(
  "/update/:id",
  upload.array("images", 6),
  updatePG
);

// Delete PG
router.delete("/delete/:id", deletePG);

router.get("/:id", getPGById);

export default router;