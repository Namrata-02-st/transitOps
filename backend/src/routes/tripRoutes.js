const express = require('express');
const router = express.Router();
const { getTrips, getTripById, createTrip, dispatchTrip, completeTrip, cancelTrip } = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/', roleMiddleware(['ADMIN','DISPATCHER']), createTrip);
router.patch('/:id/dispatch', roleMiddleware(['ADMIN','DISPATCHER']), dispatchTrip);
router.patch('/:id/complete', roleMiddleware(['ADMIN','DISPATCHER']), completeTrip);
router.patch('/:id/cancel', roleMiddleware(['ADMIN','DISPATCHER']), cancelTrip);
module.exports = router;
