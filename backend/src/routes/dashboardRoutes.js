const express = require('express');
const router = express.Router();
const { getKPIs, getVehicleStatusChart, getExpenseSummary, getRecentTrips } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/kpis', getKPIs);
router.get('/vehicle-status', getVehicleStatusChart);
router.get('/expense-summary', getExpenseSummary);
router.get('/recent-trips', getRecentTrips);
module.exports = router;
