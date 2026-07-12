const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', getExpenses);
router.post('/', roleMiddleware(['ADMIN','FINANCIAL_ANALYST']), createExpense);
router.put('/:id', roleMiddleware(['ADMIN','FINANCIAL_ANALYST']), updateExpense);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteExpense);
module.exports = router;
