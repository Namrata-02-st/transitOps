const bcrypt = require("bcryptjs");

const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [users] = await db.execute(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash,
        u.status,
        r.name AS role
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
      LIMIT 1
    `,
    [normalizedEmail]
  );

  if (users.length === 0) {
    throw createError(401, "Invalid email or password");
  }

  const user = users[0];

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw createError(401, "Invalid email or password");
  }

  if (user.status !== "Active") {
    throw createError(403, "Your account is inactive");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const [users] = await db.execute(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.status,
        r.name AS role,
        u.created_at,
        u.updated_at
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
    `,
    [req.user.id]
  );

  if (users.length === 0) {
    throw createError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "Authenticated user retrieved successfully",
    data: users[0],
  });
});

module.exports = {
  login,
  getMe,
};