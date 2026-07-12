const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/vehicles
const getVehicles = asyncHandler(async (req, res) => {
  const { search, status, vehicle_type, region } = req.query;
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (registration_number LIKE ? OR model LIKE ? OR vehicle_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (vehicle_type) { query += ' AND vehicle_type = ?'; params.push(vehicle_type); }
  if (region) { query += ' AND region LIKE ?'; params.push(`%${region}%`); }
  query += ' ORDER BY created_at DESC';
  const [vehicles] = await db.execute(query, params);
  res.json({ success: true, message: 'Vehicles retrieved', data: vehicles });
});

// GET /api/v1/vehicles/:id
const getVehicleById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  res.json({ success: true, data: rows[0] });
});

// POST /api/v1/vehicles
const createVehicle = asyncHandler(async (req, res) => {
  const { registration_number, vehicle_name, model, vehicle_type, maximum_load_capacity, odometer, acquisition_cost, region } = req.body;
  if (!registration_number || !vehicle_name || !model || !vehicle_type || !maximum_load_capacity || !region) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const [existing] = await db.execute('SELECT id FROM vehicles WHERE registration_number = ?', [registration_number]);
  if (existing.length) return res.status(409).json({ success: false, message: 'Registration number already exists' });
  const [result] = await db.execute(
    'INSERT INTO vehicles (registration_number, vehicle_name, model, vehicle_type, maximum_load_capacity, odometer, acquisition_cost, region) VALUES (?,?,?,?,?,?,?,?)',
    [registration_number, vehicle_name, model, vehicle_type, maximum_load_capacity, odometer || 0, acquisition_cost || 0, region]
  );
  const [newVehicle] = await db.execute('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Vehicle created successfully', data: newVehicle[0] });
});

// PUT /api/v1/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const { vehicle_name, model, vehicle_type, maximum_load_capacity, odometer, acquisition_cost, region } = req.body;
  const [existing] = await db.execute('SELECT id FROM vehicles WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  await db.execute(
    'UPDATE vehicles SET vehicle_name=?, model=?, vehicle_type=?, maximum_load_capacity=?, odometer=?, acquisition_cost=?, region=? WHERE id=?',
    [vehicle_name, model, vehicle_type, maximum_load_capacity, odometer, acquisition_cost, region, req.params.id]
  );
  const [updated] = await db.execute('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Vehicle updated successfully', data: updated[0] });
});

// DELETE /api/v1/vehicles/:id (ADMIN only)
const deleteVehicle = asyncHandler(async (req, res) => {
  const [existing] = await db.execute('SELECT id FROM vehicles WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  await db.execute('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Vehicle deleted successfully' });
});

// PATCH /api/v1/vehicles/:id/retire
const retireVehicle = asyncHandler(async (req, res) => {
  const [rows] = await db.execute('SELECT id, status FROM vehicles WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  if (rows[0].status === 'On Trip') return res.status(400).json({ success: false, message: 'Cannot retire a vehicle currently on trip' });
  await db.execute('UPDATE vehicles SET status = ? WHERE id = ?', ['Retired', req.params.id]);
  res.json({ success: true, message: 'Vehicle retired successfully' });
});

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, retireVehicle };
