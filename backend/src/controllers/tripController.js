const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getTrips = asyncHandler(async (req, res) => {
  const { status, vehicle_id, driver_id } = req.query;
  let query = `SELECT t.*, v.registration_number, v.vehicle_name, d.name as driver_name,
    u.name as created_by_name FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers d ON t.driver_id = d.id
    LEFT JOIN users u ON t.created_by = u.id WHERE 1=1`;
  const params = [];
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (vehicle_id) { query += ' AND t.vehicle_id = ?'; params.push(vehicle_id); }
  if (driver_id) { query += ' AND t.driver_id = ?'; params.push(driver_id); }
  query += ' ORDER BY t.created_at DESC';
  const [trips] = await db.execute(query, params);
  res.json({ success: true, data: trips });
});

const getTripById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(
    `SELECT t.*, v.registration_number, v.vehicle_name, v.maximum_load_capacity,
     d.name as driver_name, d.license_number, u.name as created_by_name
     FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id
     LEFT JOIN drivers d ON t.driver_id = d.id LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
  res.json({ success: true, data: rows[0] });
});

const createTrip = asyncHandler(async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, starting_odometer, revenue } = req.body;
  if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance || !starting_odometer) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  // Validate vehicle
  const [vehicles] = await db.execute('SELECT id, status, maximum_load_capacity FROM vehicles WHERE id = ?', [vehicle_id]);
  if (!vehicles.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  const vehicle = vehicles[0];
  if (vehicle.status !== 'Available') return res.status(400).json({ success: false, message: `Vehicle is currently ${vehicle.status} and cannot be assigned` });
  if (parseFloat(cargo_weight) > parseFloat(vehicle.maximum_load_capacity)) {
    return res.status(400).json({ success: false, message: `Cargo weight (${cargo_weight}kg) exceeds vehicle max load capacity (${vehicle.maximum_load_capacity}kg)` });
  }
  // Validate driver
  const today = new Date().toISOString().split('T')[0];
  const [drivers] = await db.execute('SELECT id, status, license_expiry_date FROM drivers WHERE id = ?', [driver_id]);
  if (!drivers.length) return res.status(404).json({ success: false, message: 'Driver not found' });
  const driver = drivers[0];
  if (driver.status !== 'Available') return res.status(400).json({ success: false, message: `Driver is currently ${driver.status}` });
  if (driver.license_expiry_date < today) return res.status(400).json({ success: false, message: 'Driver license has expired' });
  // Check active trips
  const [activeVehicleTrip] = await db.execute('SELECT id FROM trips WHERE vehicle_id = ? AND status IN (?,?)', [vehicle_id, 'Draft', 'Dispatched']);
  if (activeVehicleTrip.length) return res.status(409).json({ success: false, message: 'Vehicle is already assigned to an active trip' });
  const [activeDriverTrip] = await db.execute('SELECT id FROM trips WHERE driver_id = ? AND status IN (?,?)', [driver_id, 'Draft', 'Dispatched']);
  if (activeDriverTrip.length) return res.status(409).json({ success: false, message: 'Driver is already assigned to an active trip' });

  const [result] = await db.execute(
    'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, starting_odometer, revenue, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
    [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, starting_odometer, revenue || 0, req.user.id]
  );
  const [newTrip] = await db.execute('SELECT * FROM trips WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Trip created as Draft', data: newTrip[0] });
});

const dispatchTrip = asyncHandler(async (req, res) => {
  const [trips] = await db.execute('SELECT * FROM trips WHERE id = ?', [req.params.id]);
  if (!trips.length) return res.status(404).json({ success: false, message: 'Trip not found' });
  const trip = trips[0];
  if (trip.status !== 'Draft') return res.status(400).json({ success: false, message: 'Only Draft trips can be dispatched' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE trips SET status=?, dispatch_date=NOW() WHERE id=?', ['Dispatched', req.params.id]);
    await conn.execute('UPDATE vehicles SET status=? WHERE id=?', ['On Trip', trip.vehicle_id]);
    await conn.execute('UPDATE drivers SET status=? WHERE id=?', ['On Trip', trip.driver_id]);
    await conn.commit();
    res.json({ success: true, message: 'Trip dispatched successfully' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const completeTrip = asyncHandler(async (req, res) => {
  const { final_odometer } = req.body;
  if (!final_odometer) return res.status(400).json({ success: false, message: 'final_odometer is required' });
  const [trips] = await db.execute('SELECT * FROM trips WHERE id = ?', [req.params.id]);
  if (!trips.length) return res.status(404).json({ success: false, message: 'Trip not found' });
  const trip = trips[0];
  if (trip.status !== 'Dispatched') return res.status(400).json({ success: false, message: 'Only Dispatched trips can be completed' });
  if (parseInt(final_odometer) <= parseInt(trip.starting_odometer)) {
    return res.status(400).json({ success: false, message: 'Final odometer must be greater than starting odometer' });
  }
  const actual_distance = parseInt(final_odometer) - parseInt(trip.starting_odometer);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE trips SET status=?, final_odometer=?, actual_distance=?, completion_date=NOW() WHERE id=?', ['Completed', final_odometer, actual_distance, req.params.id]);
    await conn.execute('UPDATE vehicles SET status=?, odometer=? WHERE id=?', ['Available', final_odometer, trip.vehicle_id]);
    await conn.execute('UPDATE drivers SET status=? WHERE id=?', ['Available', trip.driver_id]);
    await conn.commit();
    res.json({ success: true, message: 'Trip completed successfully', data: { actual_distance } });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const cancelTrip = asyncHandler(async (req, res) => {
  const [trips] = await db.execute('SELECT * FROM trips WHERE id = ?', [req.params.id]);
  if (!trips.length) return res.status(404).json({ success: false, message: 'Trip not found' });
  const trip = trips[0];
  if (!['Draft', 'Dispatched'].includes(trip.status)) return res.status(400).json({ success: false, message: 'Trip cannot be cancelled' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE trips SET status=? WHERE id=?', ['Cancelled', req.params.id]);
    if (trip.status === 'Dispatched') {
      await conn.execute('UPDATE vehicles SET status=? WHERE id=?', ['Available', trip.vehicle_id]);
      await conn.execute('UPDATE drivers SET status=? WHERE id=?', ['Available', trip.driver_id]);
    }
    await conn.commit();
    res.json({ success: true, message: 'Trip cancelled successfully' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = { getTrips, getTripById, createTrip, dispatchTrip, completeTrip, cancelTrip };
