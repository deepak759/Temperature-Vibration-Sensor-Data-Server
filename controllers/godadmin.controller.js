import User from "../models/user.model.js";
import Plant from "../models/plant.model.js";
import bcrypt from "bcryptjs";
import { sendCredentialsMail } from "../services/mailService.js";


// View all users with their plant access (godadmin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      emailVerified: true
    })
      .select("-password -emailOTP -otpExpiry -accessToken -__v")
      .sort({ createdAt: -1 });

    // Get all plants for reference
    const plants = await Plant.find({ isActive: true }).select("_id name");

    // Format response to show plant access details
    const formattedUsers = users.map(user => {
      const plantAccessDetails = [];

      if (user.role === "godadmin") {
        // Godadmin has access to all plants
        plantAccessDetails.push({
          plantId: "all",
          plantName: "All Plants",
          accessType: "godadmin"
        });
      } else if (user.plantAccess && user.plantAccess.size > 0) {
        // Map plant access
        user.plantAccess.forEach((accessType, plantId) => {
          const plant = plants.find(p => p._id.toString() === plantId);
          if (plant) {
            plantAccessDetails.push({
              plantId: plant._id,
              plantName: plant.name,
              accessType
            });
          }
        });
      }

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        plantAccess: plantAccessDetails,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      };
    });

    res.json({
      message: "All users retrieved successfully",
      users: formattedUsers,
      totalUsers: formattedUsers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add user as admin for a plant (godadmin only)
export const addAdminUser = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { username, email, password, userId } = req.body;

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant || !plant.isActive) {
      return res.status(404).json({ message: "Plant not found" });
    }

    let user;

    if (userId) {
      // Assign existing user as admin
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.plantAccess) {
        user.plantAccess = new Map();
      }
      user.plantAccess.set(plantId.toString(), "admin");

      // Update role to admin if currently viewer
      if (user.role === "viewer") {
        user.role = "admin";
      }

      await user.save();

      return res.json({
        message: "User assigned as admin successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          plantAccess: {
            plantId: plant._id,
            plantName: plant.name,
            accessType: "admin"
          }
        }
      });
    }

    // Create new admin user
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required for new users"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      // If user exists, add admin access
      if (!existingUser.plantAccess) {
        existingUser.plantAccess = new Map();
      }
      existingUser.plantAccess.set(plantId.toString(), "admin");

      if (existingUser.role === "viewer") {
        existingUser.role = "admin";
      }

      await existingUser.save();

      return res.json({
        message: "User already exists. Admin access added successfully",
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
      role: "admin",
      emailVerified: true, // Auto-verify when created by godadmin
      emailOTP: null, // Explicitly set to null to avoid OTP fields
      otpExpiry: null,
      deleteAt: null,
      plantAccess: new Map([[plantId.toString(), "admin"]])
    });

    // Send credentials email instead of OTP
    await sendCredentialsMail(email, username, password, "admin", plant.name);

    res.status(201).json({
      message: "Admin user created successfully. Credentials sent to email",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        plantAccess: {
          plantId: plant._id,
          plantName: plant.name,
          accessType: "admin"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove admin access from a user (godadmin only)
export const removeAdminAccess = async (req, res) => {
  try {
    const { plantId, userId } = req.params;

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant || !plant.isActive) {
      return res.status(404).json({ message: "Plant not found" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove admin access for this plant
    if (user.plantAccess && user.plantAccess.has(plantId.toString())) {
      user.plantAccess.delete(plantId.toString());

      // If user has no more plant access, keep role as admin but they'll need new assignments
      await user.save();
    }

    res.json({
      message: "Admin access removed successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
