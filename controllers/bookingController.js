import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  try {

    const { userId, ownerId, pgId } = req.body;

    const existingBooking = await Booking.findOne({
      userId,
      pgId,
      status: "Pending",
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Booking request already sent.",
      });
    }

    const booking = new Booking({
      userId,
      ownerId,
      pgId,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Booking request sent successfully.",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const getOwnerBookings = async (req, res) => {
  try {

    const { ownerId } = req.params;

    const bookings = await Booking.find({ ownerId })
      .populate("userId", "username email mobile")
      .populate("pgId", "pgName");

    res.status(200).json({
      success: true,
      bookings,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const getUserBookings = async (req, res) => {
  try {

    const { userId } = req.params;

    const bookings = await Booking.find({ userId })
      .populate("pgId", "pgName city state")
      .populate("ownerId", "username mobile");

    res.status(200).json({
      success: true,
      bookings,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const updateBookingStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const getOwnerVisitorStats = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const totalVisitors = await Booking.countDocuments({
      ownerId,
      status: "Accepted",
    });

    const newVisitors = await Booking.countDocuments({
      ownerId,
      status: "Pending",
    });

    res.status(200).json({
      success: true,
      totalVisitors,
      newVisitors,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};