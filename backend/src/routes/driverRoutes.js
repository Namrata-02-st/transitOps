const express = require('express');
const router = express.Router();
const { getDrivers, getAvailableDrivers, getDriverById, createDriver, updateDriver, deleteDriver, suspendDriver } = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', getDrivers);
router.get('/available', getAvailableDrivers);
router.get('/:id', getDriverById);
router.post('/', roleMiddleware(['ADMIN','FLEET_MANAGER']), createDriver);
router.put('/:id', roleMiddleware(['ADMIN','FLEET_MANAGER','SAFETY_OFFICER']), updateDriver);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteDriver);
router.patch('/:id/suspend', roleMiddleware(['ADMIN','SAFETY_OFFICER']), suspendDriver);
module.exports = router;
