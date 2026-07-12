const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getExpenses = asyncHandler(async (req, res) => {
  const { vehicle_id, expense_type, start_date, end_date } = req.query;
  let query = `SELECT e.*, v.registration_number, v.vehicle_name, u.name as created_by_name
    FROM expenses e LEFT JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN users u ON e.created_by = u.id WHERE 1=1`;
  const params = [];
  if (vehicle_id) { query += ' AND e.vehicle_id = ?'; params.push(vehicle_id); }
  if (expense_type) { query += ' AND e.expense_type = ?'; params.push(expense_type); }
  if (start_date) { query += ' AND e.expense_date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND e.expense_date <= ?'; params.push(end_date); }
  query += ' ORDER BY e.expense_date DESC';
  const [expenses] = await db.execute(query, params);
  res.json({ success: true, data: expenses });
});

const createExpense = asyncHandler(async (req, res) => {
  const { vehicle_id, trip_id, expense_type, description, amount, expense_date } = req.body;
  if (!vehicle_id || !expense_type || !description || !amount || !expense_date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const [result] = await db.execute(
    'INSERT INTO expenses (vehicle_id, trip_id, expense_type, description, amount, expense_date, created_by) VALUES (?,?,?,?,?,?,?)',
    [vehicle_id, trip_id || null, expense_type, description, amount, expense_date, req.user.id]
  );
  const [newExp] = await db.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Expense created', data: newExp[0] });
});

const updateExpense = asyncHandler(async (req, res) => {
  const { expense_type, description, amount, expense_date } = req.body;
  const [existing] = await db.execute('SELECT id FROM expenses WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Expense not found' });
  await db.execute('UPDATE expenses SET expense_type=?, description=?, amount=?, expense_date=? WHERE id=?', [expense_type, description, amount, expense_date, req.params.id]);
  const [updated] = await db.execute('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Expense updated', data: updated[0] });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const [existing] = await db.execute('SELECT id FROM expenses WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Expense not found' });
  await db.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
