import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Inavlid email format" });
    }

    // Password hash
    const hash = await bcrypt.hash(password, 10);

    const insertquery =
      "INSERT INTO users (name, email, password_hash,phone) VALUES (?, ?, ?,?)";

    db.query(insertquery, [name, email, hash, phone], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error inserting user" });
      }

      res.status(201).json({
        message: "User created successfully ✅ ",
        userId: result.insertId,
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
export const login = (req, res) => {
  const { email, password } = req.body;
  // Validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const query = "SELECT * FROM users where email = ?";

  db.query(query, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "DB error" });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful ✅",
      token,
      // For dynamic user data in frontend
      user: {
    id: user.id,
    name: user.name,
    email: user.email,
  },
    });
  });
};
