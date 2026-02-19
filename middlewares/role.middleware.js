import User from "../models/user.model.js";

// Middleware to require godadmin role
export const requireGodAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.role !== "godadmin") {
      return res.status(403).json({
        message: "Godadmin access required"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to require admin access (either godadmin or admin for specific plant)
export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const plantId = req.params.plantId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Godadmin has access to everything
    if (user.role === "godadmin") {
      req.user = user;
      return next();
    }

    // Check if user has admin access to the plant
    if (!plantId) {
      return res.status(400).json({
        message: "Plant ID is required"
      });
    }

    const plantAccess = user.plantAccess?.get(plantId.toString());

    if (plantAccess !== "admin" && user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required for this plant"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to require viewer access (godadmin, admin, or viewer for specific plant)
export const requireViewer = async (req, res, next) => {
  try {
    const userId = req.userId;
    const plantId = req.params.plantId || req.body.plantId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Godadmin has access to everything
    if (user.role === "godadmin") {
      req.user = user;
      return next();
    }

    // Check if user has access to the plant
    if (plantId) {
      const plantAccess = user.plantAccess?.get(plantId.toString());

      if (plantAccess === "admin" || plantAccess === "viewer") {
        req.user = user;
        return next();
      }
    }

    // If no plantId specified, allow if user is admin or viewer
    if (user.role === "admin" || user.role === "viewer") {
      req.user = user;
      return next();
    }

    return res.status(403).json({
      message: "Access denied"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
