import User from "../models/user.model.js";
import Plant from "../models/plant.model.js";
import AlertEmail from "../models/alertEmail.model.js";
import bcrypt from "bcryptjs";
import { sendCredentialsMail } from "../services/mailService.js";


// Add user for viewing dashboard (admin only)
export const addViewerUser = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { username, email, password } = req.body;
    const adminId = req.userId;

    // Verify admin has access to this plant
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if admin has admin access to this plant
    const plantAccess = admin.plantAccess?.get(plantId.toString());
    if (admin.role !== "godadmin" && plantAccess !== "admin") {
      return res.status(403).json({
        message: "You don't have admin access to this plant"
      });
    }

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant || !plant.isActive) {
      return res.status(404).json({ message: "Plant not found" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      // If user exists, add plant access
      if (!existingUser.plantAccess) {
        existingUser.plantAccess = new Map();
      }
      existingUser.plantAccess.set(plantId.toString(), "viewer");
      await existingUser.save();

      return res.json({
        message: "User already exists. Plant access added successfully",
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role
        }
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "viewer",
      emailVerified: true, // Auto-verify when created by admin
      emailOTP: null, // Explicitly set to null to avoid OTP fields
      otpExpiry: null,
      deleteAt: null,
      plantAccess: new Map([[plantId.toString(), "viewer"]])
    });

    // Send credentials email instead of OTP
    await sendCredentialsMail(email, username, password, "viewer", plant.name);

    res.status(201).json({
      message: "Viewer user created successfully. Credentials sent to email",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View all users for a plant (admin only)
export const getPlantUsers = async (req, res) => {
  try {
    const { plantId } = req.params;
    const adminId = req.userId;

    // Verify admin has access to this plant
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const plantAccess = admin.plantAccess?.get(plantId.toString());
    if (admin.role !== "godadmin" && plantAccess !== "admin") {
      return res.status(403).json({
        message: "You don't have admin access to this plant"
      });
    }

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant || !plant.isActive) {
      return res.status(404).json({ message: "Plant not found" });
    }

    // Get all users with access to this plant
    const users = await User.find({
      $or: [
        { role: "godadmin" },
        { [`plantAccess.${plantId}`]: { $exists: true } }
      ]
    }).select("-password -emailOTP -otpExpiry -accessToken -__v");

    // Format response to show plant access
    const formattedUsers = users.map(user => {
      const access = user.role === "godadmin"
        ? "godadmin"
        : user.plantAccess?.get(plantId.toString()) || null;

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        plantAccess: access,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      };
    }).filter(user => user.plantAccess !== null || user.role === "godadmin");

    res.json({
      message: "Plant users retrieved successfully",
      plant: {
        id: plant._id,
        name: plant.name
      },
      users: formattedUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add alert email (admin only)
export const addAlertEmail = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { email } = req.body;
    const adminId = req.userId;

    // Verify admin has access to this plant
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const plantAccess = admin.plantAccess?.get(plantId.toString());
    if (admin.role !== "godadmin" && plantAccess !== "admin") {
      return res.status(403).json({
        message: "You don't have admin access to this plant"
      });
    }

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant || !plant.isActive) {
      return res.status(404).json({ message: "Plant not found" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if alert email already exists for this plant
    const existingAlert = await AlertEmail.findOne({
      plantId,
      email: email.trim().toLowerCase()
    });

    if (existingAlert) {
      if (existingAlert.isActive) {
        return res.status(400).json({
          message: "Alert email already exists for this plant"
        });
      } else {
        // Reactivate existing alert email
        existingAlert.isActive = true;
        existingAlert.addedBy = adminId;
        await existingAlert.save();

        return res.json({
          message: "Alert email reactivated successfully",
          alertEmail: existingAlert
        });
      }
    }

    // Create new alert email
    const alertEmail = await AlertEmail.create({
      plantId,
      email: email.trim().toLowerCase(),
      addedBy: adminId
    });

    const populatedAlert = await AlertEmail.findById(alertEmail._id)
      .populate("addedBy", "username email")
      .select("-__v");

    res.status(201).json({
      message: "Alert email added successfully",
      alertEmail: populatedAlert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View all alert emails for a plant (admin only)
export const getPlantAlertEmails = async (req, res) => {
  try {
    const { plantId } = req.params;
    const adminId = req.userId;

    // Verify admin has access to this plant
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const plantAccess = admin.plantAccess?.get(plantId.toString());
    if (admin.role !== "godadmin" && plantAccess !== "admin") {
      return res.status(403).json({
        message: "You don't have admin access to this plant"
      });
    }

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant || !plant.isActive) {
      return res.status(404).json({ message: "Plant not found" });
    }

    // Get all alert emails for this plant
    const alertEmails = await AlertEmail.find({
      plantId,
      isActive: true
    })
      .populate("addedBy", "username email")
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json({
      message: "Alert emails retrieved successfully",
      plant: {
        id: plant._id,
        name: plant.name
      },
      alertEmails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove alert email (admin only)
export const removeAlertEmail = async (req, res) => {
  try {
    const { plantId, alertEmailId } = req.params;
    const adminId = req.userId;

    // Verify admin has access to this plant
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const plantAccess = admin.plantAccess?.get(plantId.toString());
    if (admin.role !== "godadmin" && plantAccess !== "admin") {
      return res.status(403).json({
        message: "You don't have admin access to this plant"
      });
    }

    // Find and deactivate alert email
    const alertEmail = await AlertEmail.findOne({
      _id: alertEmailId,
      plantId
    });

    if (!alertEmail) {
      return res.status(404).json({ message: "Alert email not found" });
    }

    alertEmail.isActive = false;
    await alertEmail.save();

    res.json({
      message: "Alert email removed successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
