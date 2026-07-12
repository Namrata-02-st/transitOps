const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getDrivers = asyncHandler(async (req, res) => {
  const { search, status, license_category, region } = req.query;
  let query = 'SELECT * FROM drivers WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR license_number LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (license_category) { query += ' AND license_category = ?'; params.push(license_category); }
  if (region) { query += ' AND region LIKE ?'; params.push(`%${region}%`); }
  query += ' ORDER BY created_at DESC';
  const [drivers] = await db.execute(query, params);
  res.json({ success: true, data: drivers });
});

const getAvailableDrivers = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const [drivers] = await db.execute(
    'SELECT * FROM drivers WHERE status = ? AND license_expiry_date >= ?',
    ['Available', today]
  );
  res.json({ success: true, data: drivers });
});

const getDriverById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Driver not found' });
  res.json({ success: true, data: rows[0] });
});

const createDriver = asyncHandler(async (req, res) => {
  const { name, email, license_number, license_category, license_expiry_date, contact_number, safety_score, region } = req.body;
  if (!name || !email || !license_number || !license_category || !license_expiry_date || !contact_number || !region) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const [existing] = await db.execute('SELECT id FROM drivers WHERE license_number = ? OR email = ?', [license_number, email]);
  if (existing.length) return res.status(409).json({ success: false, message: 'License number or email already exists' });
  const [result] = await db.execute(
    'INSERT INTO drivers (name, email, license_number, license_category, license_expiry_date, contact_number, safety_score, region) VALUES (?,?,?,?,?,?,?,?)',
    [name, email, license_number, license_category, license_expiry_date, contact_number, safety_score || 100, region]
  );
  const [newDriver] = await db.execute('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Driver created successfully', data: newDriver[0] });
});

const updateDriver = asyncHandler(async (req, res) => {
  const { name, email, license_category, license_expiry_date, contact_number, safety_score, region, status } = req.body;
  const [existing] = await db.execute('SELECT id FROM drivers WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Driver not found' });
  await db.execute(
    'UPDATE drivers SET name=?, email=?, license_category=?, license_expiry_date=?, contact_number=?, safety_score=?, region=?, status=? WHERE id=?',
    [name, email, license_category, license_expiry_date, contact_number, safety_score, region, status, req.params.id]
  );
  const [updated] = await db.execute('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Driver updated successfully', data: updated[0] });
});

const deleteDriver = asyncHandler(async (req, res) => {
  const [existing] = await db.execute('SELECT id FROM drivers WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Driver not found' });
  await db.execute('DELETE FROM drivers WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Driver deleted successfully' });
});

const suspendDriver = asyncHandler(async (req, res) => {
  const [rows] = await db.execute('SELECT id, status FROM drivers WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Driver not found' });
  if (rows[0].status === 'On Trip') return res.status(400).json({ success: false, message: 'Cannot suspend a driver currently on trip' });
  await db.execute('UPDATE drivers SET status = ? WHERE id = ?', ['Suspended', req.params.id]);
  res.json({ success: true, message: 'Driver suspended successfully' });
});

module.exports = { getDrivers, getAvailableDrivers, getDriverById, createDriver, updateDriver, deleteDriver, suspendDriver };
