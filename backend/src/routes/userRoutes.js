const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUserRole, updateUserStatus } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);
module.exports = router;
