import PG from "../models/PG.js";

export const addPG = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);
  try {
    const {
      ownerId,
      pgName,
      type,
      state,
      city,
      rooms,
      address,
      balcony,
      water,
      electricity,
      breakfast,
      lunch,
      dinner,
    } = req.body;

    // Multiple uploaded images
    const images = req.files
      ? req.files.map((file) => file.filename)
      : [];

    const newPG = new PG({
      ownerId,
      pgName,
      type,
      state,
      city,
      rooms,
      address,
      balcony,
      water,
      electricity,
      breakfast,
      lunch,
      dinner,
      images,
    });

    await newPG.save();

    res.status(201).json({
      success: true,
      message: "PG Added Successfully",
      pg: newPG,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const getMyPGs = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const pgs = await PG.find({ ownerId });

    res.status(200).json({
      success: true,
      pgs,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const deletePG = async (req, res) => {
  try {

    const { id } = req.params;

    const pg = await PG.findById(id);

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    await PG.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "PG Deleted Successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const updatePG = async (req, res) => {
  try {

    const { id } = req.params;

    const pg = await PG.findById(id);

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG Not Found",
      });
    }

    pg.pgName = req.body.pgName;
    pg.type = req.body.type;
    pg.state = req.body.state;
    pg.city = req.body.city;
    pg.rooms = req.body.rooms;
    pg.address = req.body.address;

    // New images
    if (req.files && req.files.length > 0) {

      const newImageNames = req.files.map(
        (file) => file.filename
      );

      // NEW IMAGES FIRST
      // OLD IMAGES AFTER
      pg.images = [
        ...newImageNames,
        ...(pg.images || [])
      ];

      // Maximum 6
      pg.images = pg.images.slice(0, 6);

    }

    await pg.save();

    res.status(200).json({
      success: true,
      message: "PG Updated Successfully",
      pg,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const getAllPGs = async (req, res) => {
  try {

    const pgs = await PG.find().populate(
      "ownerId",
      "username email mobile"
    );

    res.status(200).json({
      success: true,
      pgs,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const getPGById = async (req, res) => {
  try {

    const { id } = req.params;

    const pg = await PG.findById(id).populate(
      "ownerId",
      "username email mobile"
    );

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    res.status(200).json({
      success: true,
      pg,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};