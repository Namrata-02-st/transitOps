const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getKPIs = asyncHandler(async (req, res) => {
  const [[vehicleStats]] = await db.execute(`SELECT
    COUNT(*) as total_vehicles,
    SUM(CASE WHEN status='Available' THEN 1 ELSE 0 END) as available_vehicles,
    SUM(CASE WHEN status='On Trip' THEN 1 ELSE 0 END) as vehicles_on_trip,
    SUM(CASE WHEN status='In Shop' THEN 1 ELSE 0 END) as vehicles_in_shop,
    SUM(CASE WHEN status!='Retired' THEN 1 ELSE 0 END) as active_vehicles
    FROM vehicles`);

  const [[tripStats]] = await db.execute(`SELECT
    SUM(CASE WHEN status='Dispatched' THEN 1 ELSE 0 END) as active_trips,
    SUM(CASE WHEN status='Draft' THEN 1 ELSE 0 END) as pending_trips
    FROM trips`);

  const [[driverStats]] = await db.execute(`SELECT
    SUM(CASE WHEN status='Available' THEN 1 ELSE 0 END) as available_drivers,
    SUM(CASE WHEN status='On Trip' THEN 1 ELSE 0 END) as drivers_on_duty
    FROM drivers`);

  const [[costStats]] = await db.execute(`SELECT
    COALESCE((SELECT SUM(cost) FROM fuel_logs),0) as total_fuel_cost,
    COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE status='Completed'),0) as total_maintenance_cost,
    COALESCE((SELECT SUM(amount) FROM expenses),0) as total_expenses`);

  const activeVehicles = parseInt(vehicleStats.active_vehicles) || 1;
  const onTrip = parseInt(vehicleStats.vehicles_on_trip) || 0;
  const fleet_utilization = parseFloat(((onTrip / activeVehicles) * 100).toFixed(2));

  const totalOperationalCost = parseFloat(costStats.total_fuel_cost) + parseFloat(costStats.total_maintenance_cost) + parseFloat(costStats.total_expenses);

  res.json({
    success: true, data: {
      ...vehicleStats, ...tripStats, ...driverStats, ...costStats,
      total_operational_cost: totalOperationalCost.toFixed(2),
      fleet_utilization
    }
  });
});

const getVehicleStatusChart = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`SELECT status, COUNT(*) as count FROM vehicles GROUP BY status`);
  res.json({ success: true, data: rows });
});

const getExpenseSummary = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`
    SELECT DATE_FORMAT(expense_date, '%Y-%m') as month,
    SUM(amount) as total_expenses FROM expenses
    GROUP BY month ORDER BY month DESC LIMIT 12`);
  const [fuelRows] = await db.execute(`
    SELECT DATE_FORMAT(fuel_date, '%Y-%m') as month,
    SUM(cost) as total_fuel FROM fuel_logs
    GROUP BY month ORDER BY month DESC LIMIT 12`);
  res.json({ success: true, data: { expenses: rows, fuel: fuelRows } });
});

const getRecentTrips = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`
    SELECT t.id, t.source, t.destination, t.status, t.dispatch_date, t.revenue,
    v.registration_number, d.name as driver_name
    FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers d ON t.driver_id = d.id
    ORDER BY t.created_at DESC LIMIT 10`);
  res.json({ success: true, data: rows });
});

module.exports = { getKPIs, getVehicleStatusChart, getExpenseSummary, getRecentTrips };
