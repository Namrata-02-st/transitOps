const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');

// Public route to log in
router.post('/login', validateLogin, login);

// Private protected route to fetch current active profile
router.get('/me', authMiddleware, getMe);

module.exports = router;
