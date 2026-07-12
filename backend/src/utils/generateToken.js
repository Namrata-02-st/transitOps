const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(user) {
  // Payload contains crucial user properties (excluding security secrets)
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role_name // We fetch and join role_name when logging in
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
}

module.exports = generateToken;
