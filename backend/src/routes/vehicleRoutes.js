const express = require('express');
const router = express.Router();
const { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, retireVehicle } = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', roleMiddleware(['ADMIN','FLEET_MANAGER']), createVehicle);
router.put('/:id', roleMiddleware(['ADMIN','FLEET_MANAGER']), updateVehicle);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteVehicle);
router.patch('/:id/retire', roleMiddleware(['ADMIN','FLEET_MANAGER']), retireVehicle);
module.exports = router;
