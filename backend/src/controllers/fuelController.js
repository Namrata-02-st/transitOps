const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getFuelLogs = asyncHandler(async (req, res) => {
  const { vehicle_id, start_date, end_date } = req.query;
  let query = `SELECT f.*, v.registration_number, v.vehicle_name, u.name as created_by_name
    FROM fuel_logs f LEFT JOIN vehicles v ON f.vehicle_id = v.id
    LEFT JOIN users u ON f.created_by = u.id WHERE 1=1`;
  const params = [];
  if (vehicle_id) { query += ' AND f.vehicle_id = ?'; params.push(vehicle_id); }
  if (start_date) { query += ' AND f.fuel_date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND f.fuel_date <= ?'; params.push(end_date); }
  query += ' ORDER BY f.fuel_date DESC';
  const [logs] = await db.execute(query, params);
  res.json({ success: true, data: logs });
});

const createFuelLog = asyncHandler(async (req, res) => {
  const { vehicle_id, trip_id, liters, cost, fuel_date, odometer_reading } = req.body;
  if (!vehicle_id || !liters || !cost || !fuel_date || !odometer_reading) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const [result] = await db.execute(
    'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, fuel_date, odometer_reading, created_by) VALUES (?,?,?,?,?,?,?)',
    [vehicle_id, trip_id || null, liters, cost, fuel_date, odometer_reading, req.user.id]
  );
  const [newLog] = await db.execute('SELECT * FROM fuel_logs WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Fuel log created successfully', data: newLog[0] });
});

const updateFuelLog = asyncHandler(async (req, res) => {
  const { liters, cost, fuel_date, odometer_reading } = req.body;
  const [existing] = await db.execute('SELECT id FROM fuel_logs WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Fuel log not found' });
  await db.execute('UPDATE fuel_logs SET liters=?, cost=?, fuel_date=?, odometer_reading=? WHERE id=?', [liters, cost, fuel_date, odometer_reading, req.params.id]);
  const [updated] = await db.execute('SELECT * FROM fuel_logs WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Fuel log updated', data: updated[0] });
});

const deleteFuelLog = asyncHandler(async (req, res) => {
  const [existing] = await db.execute('SELECT id FROM fuel_logs WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Fuel log not found' });
  await db.execute('DELETE FROM fuel_logs WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Fuel log deleted' });
});

module.exports = { getFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog };
