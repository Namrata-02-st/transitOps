const db = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

const getUsers = asyncHandler(async (req, res) => {
  const [users] = await db.execute(`SELECT u.id, u.name, u.email, u.status, u.created_at, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC`);
  res.json({ success: true, data: users });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role_id } = req.body;
  if (!name || !email || !password || !role_id) return res.status(400).json({ success: false, message: 'Missing required fields' });
  const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(409).json({ success: false, message: 'Email already exists' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.execute('INSERT INTO users (name, email, password, role_id) VALUES (?,?,?,?)', [name, email, hashedPassword, role_id]);
  res.status(201).json({ success: true, message: 'User created', data: { id: result.insertId, name, email } });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role_id } = req.body;
  if (!role_id) return res.status(400).json({ success: false, message: 'role_id is required' });
  const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'User not found' });
  await db.execute('UPDATE users SET role_id = ? WHERE id = ?', [role_id, req.params.id]);
  res.json({ success: true, message: 'User role updated' });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Inactive'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true, message: `User ${status.toLowerCase()}` });
});

module.exports = { getUsers, createUser, updateUserRole, updateUserStatus };
