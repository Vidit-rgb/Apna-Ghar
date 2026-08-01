import mongoose from "mongoose";

const pgSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },

    pgName: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    rooms: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    balcony: {
      type: String,
      required: true,
    },

    water: {
      type: String,
      required: true,
    },

    electricity: {
      type: String,
      required: true,
    },

    breakfast: {
      type: String,
      required: true,
    },

    lunch: {
      type: String,
      required: true,
    },

    dinner: {
      type: String,
      required: true,
    },
      images: {
        type: [String],
        default: [],
      },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("PG", pgSchema);