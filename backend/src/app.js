const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount all routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/v1/drivers', require('./routes/driverRoutes'));
app.use('/api/v1/trips', require('./routes/tripRoutes'));
app.use('/api/v1/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/v1/fuel', require('./routes/fuelRoutes'));
app.use('/api/v1/expenses', require('./routes/expenseRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/reports', require('./routes/reportRoutes'));

app.get('/api/v1/health', (req, res) => res.json({ success: true, message: 'TransitOps API is running!', timestamp: new Date() }));

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
