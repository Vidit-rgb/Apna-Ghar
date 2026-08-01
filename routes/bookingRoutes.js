import express from "express";

import {
  createBooking,
  getOwnerBookings,
  getUserBookings,
  updateBookingStatus,
  getOwnerVisitorStats,
} from "../controllers/bookingController.js";

const router = express.Router();

// Create Booking
router.post("/create", createBooking);

// Owner Bookings
router.get("/owner/:ownerId", getOwnerBookings);

// User Bookings
router.get("/user/:userId", getUserBookings);

// Accept / Reject Booking
router.put("/status/:id", updateBookingStatus);

router.get("/stats/:ownerId", getOwnerVisitorStats);

export default router;