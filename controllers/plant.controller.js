import Plant from "../models/plant.model.js";

// Get all plants (for godadmin)
export const getAllPlants = async (req, res) => {
  try {
    const plants = await Plant.find({ isActive: true })
      .populate("createdBy", "username email")
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json({
      message: "Plants retrieved successfully",
      plants
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single plant
export const getPlantById = async (req, res) => {
  try {
    const { plantId } = req.params;

    const plant = await Plant.findById(plantId)
      .populate("createdBy", "username email")
      .select("-__v");

    if (!plant || !plant.isActive) {
      return res.status(404).json({
        message: "Plant not found"
      });
    }

    res.json({
      message: "Plant retrieved successfully",
      plant
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create plant (godadmin only)
export const createPlant = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        message: "Plant name is required"
      });
    }

    // Check if plant already exists
    const existingPlant = await Plant.findOne({ name: name.trim() });
    if (existingPlant) {
      return res.status(400).json({
        message: "Plant with this name already exists"
      });
    }

    const plant = await Plant.create({
      name: name.trim(),
      description: description?.trim(),
      location: location?.trim(),
      createdBy: userId
    });

    const populatedPlant = await Plant.findById(plant._id)
      .populate("createdBy", "username email")
      .select("-__v");

    res.status(201).json({
      message: "Plant created successfully",
      plant: populatedPlant
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update plant (godadmin only)
export const updatePlant = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { name, description, location, isActive } = req.body;

    const plant = await Plant.findById(plantId);

    if (!plant) {
      return res.status(404).json({
        message: "Plant not found"
      });
    }

    if (name) plant.name = name.trim();
    if (description !== undefined) plant.description = description?.trim();
    if (location !== undefined) plant.location = location?.trim();
    if (isActive !== undefined) plant.isActive = isActive;

    await plant.save();

    const updatedPlant = await Plant.findById(plant._id)
      .populate("createdBy", "username email")
      .select("-__v");

    res.json({
      message: "Plant updated successfully",
      plant: updatedPlant
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete plant (godadmin only - soft delete)
export const deletePlant = async (req, res) => {
  try {
    const { plantId } = req.params;

    const plant = await Plant.findById(plantId);

    if (!plant) {
      return res.status(404).json({
        message: "Plant not found"
      });
    }

    plant.isActive = false;
    await plant.save();

    res.json({
      message: "Plant deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
