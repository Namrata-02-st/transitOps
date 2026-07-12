const express = require('express');
const router = express.Router();
const { getVehicleCosts, getFuelEfficiency, getFleetUtilization, getVehicleROI, exportCSV } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN','FINANCIAL_ANALYST']));
router.get('/vehicle-costs', getVehicleCosts);
router.get('/fuel-efficiency', getFuelEfficiency);
router.get('/fleet-utilization', getFleetUtilization);
router.get('/vehicle-roi', getVehicleROI);
router.get('/export/csv', exportCSV);
module.exports = router;
