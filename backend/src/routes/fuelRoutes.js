const express = require('express');
const router = express.Router();
const { getFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog } = require('../controllers/fuelController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', getFuelLogs);
router.post('/', roleMiddleware(['ADMIN','FINANCIAL_ANALYST']), createFuelLog);
router.put('/:id', roleMiddleware(['ADMIN','FINANCIAL_ANALYST']), updateFuelLog);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteFuelLog);
module.exports = router;
