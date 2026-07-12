const express = require('express');
const router = express.Router();
const { getMaintenance, getMaintenanceById, createMaintenance, completeMaintenance, cancelMaintenance } = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', getMaintenance);
router.get('/:id', getMaintenanceById);
router.post('/', roleMiddleware(['ADMIN','FLEET_MANAGER']), createMaintenance);
router.patch('/:id/complete', roleMiddleware(['ADMIN','FLEET_MANAGER']), completeMaintenance);
router.patch('/:id/cancel', roleMiddleware(['ADMIN','FLEET_MANAGER']), cancelMaintenance);
module.exports = router;
