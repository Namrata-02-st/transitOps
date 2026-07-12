const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getMaintenance = asyncHandler(async (req, res) => {
  const { status, vehicle_id } = req.query;
  let query = `SELECT m.*, v.registration_number, v.vehicle_name, u.name as created_by_name
    FROM maintenance_logs m LEFT JOIN vehicles v ON m.vehicle_id = v.id
    LEFT JOIN users u ON m.created_by = u.id WHERE 1=1`;
  const params = [];
  if (status) { query += ' AND m.status = ?'; params.push(status); }
  if (vehicle_id) { query += ' AND m.vehicle_id = ?'; params.push(vehicle_id); }
  query += ' ORDER BY m.created_at DESC';
  const [logs] = await db.execute(query, params);
  res.json({ success: true, data: logs });
});

const getMaintenanceById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(
    `SELECT m.*, v.registration_number, v.vehicle_name FROM maintenance_logs m
     LEFT JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = ?`, [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  res.json({ success: true, data: rows[0] });
});

const createMaintenance = asyncHandler(async (req, res) => {
  const { vehicle_id, maintenance_type, description, priority, start_date, cost } = req.body;
  if (!vehicle_id || !maintenance_type || !description || !start_date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const [vehicles] = await db.execute('SELECT id, status FROM vehicles WHERE id = ?', [vehicle_id]);
  if (!vehicles.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  if (vehicles[0].status === 'Retired') return res.status(400).json({ success: false, message: 'Cannot schedule maintenance for a retired vehicle' });
  if (vehicles[0].status === 'On Trip') return res.status(400).json({ success: false, message: 'Cannot schedule maintenance for a vehicle on trip' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO maintenance_logs (vehicle_id, maintenance_type, description, priority, start_date, cost, created_by) VALUES (?,?,?,?,?,?,?)',
      [vehicle_id, maintenance_type, description, priority || 'Medium', start_date, cost || 0, req.user.id]
    );
    await conn.execute('UPDATE vehicles SET status=? WHERE id=?', ['In Shop', vehicle_id]);
    await conn.commit();
    const [newLog] = await db.execute('SELECT * FROM maintenance_logs WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Maintenance record created, vehicle moved to In Shop', data: newLog[0] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const completeMaintenance = asyncHandler(async (req, res) => {
  const { end_date, cost } = req.body;
  const [rows] = await db.execute('SELECT * FROM maintenance_logs WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  if (rows[0].status !== 'Active') return res.status(400).json({ success: false, message: 'Only Active maintenance can be completed' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE maintenance_logs SET status=?, end_date=?, cost=? WHERE id=?', ['Completed', end_date || new Date().toISOString().split('T')[0], cost || rows[0].cost, req.params.id]);
    const [vehicleRows] = await conn.execute('SELECT status FROM vehicles WHERE id = ?', [rows[0].vehicle_id]);
    if (vehicleRows.length && vehicleRows[0].status !== 'Retired') {
      await conn.execute('UPDATE vehicles SET status=? WHERE id=?', ['Available', rows[0].vehicle_id]);
    }
    await conn.commit();
    res.json({ success: true, message: 'Maintenance completed, vehicle returned to Available' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const cancelMaintenance = asyncHandler(async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM maintenance_logs WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  if (rows[0].status !== 'Active') return res.status(400).json({ success: false, message: 'Only Active maintenance can be cancelled' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE maintenance_logs SET status=? WHERE id=?', ['Cancelled', req.params.id]);
    const [vehicleRows] = await conn.execute('SELECT status FROM vehicles WHERE id = ?', [rows[0].vehicle_id]);
    if (vehicleRows.length && vehicleRows[0].status === 'In Shop') {
      await conn.execute('UPDATE vehicles SET status=? WHERE id=?', ['Available', rows[0].vehicle_id]);
    }
    await conn.commit();
    res.json({ success: true, message: 'Maintenance cancelled' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = { getMaintenance, getMaintenanceById, createMaintenance, completeMaintenance, cancelMaintenance };
