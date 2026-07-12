const db = require('../config/db');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Authenticate User & Get Token
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and join with roles to get string name
  const [users] = await db.execute(
    `SELECT u.id, u.name, u.email, u.password, u.status, r.name as role_name 
     FROM users u 
     INNER JOIN roles r ON u.role_id = r.id 
     WHERE u.email = ? LIMIT 1`,
    [email]
  );

  if (users.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const user = users[0];

  // Check if account is active
  if (user.status !== 'Active') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact your administrator.'
    });
  }

  // Verify bcrypt password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name
      },
      token
    }
  });
});

// @desc    Get Current User Profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // User profile details are already verified and attached to req.user by authMiddleware
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: req.user
    }
  });
});

module.exports = {
  login,
  getMe
};
