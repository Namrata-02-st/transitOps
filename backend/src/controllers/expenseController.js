const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const expenseTypes = [
  "Toll",
  "Parking",
  "Repair",
  "Maintenance",
  "Other",
];

const getExpenses = asyncHandler(async (req, res) => {
  const {
    vehicle_id,
    trip_id,
    expense_type,
    date_from,
    date_to,
  } = req.query;

  const conditions = [];
  const parameters = [];

  if (vehicle_id) {
    conditions.push("e.vehicle_id = ?");
    parameters.push(vehicle_id);
  }

  if (trip_id) {
    conditions.push("e.trip_id = ?");
    parameters.push(trip_id);
  }

  if (expense_type) {
    conditions.push("e.expense_type = ?");
    parameters.push(expense_type);
  }

  if (date_from) {
    conditions.push("e.expense_date >= ?");
    parameters.push(date_from);
  }

  if (date_to) {
    conditions.push("e.expense_date <= ?");
    parameters.push(date_to);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const [expenses] = await db.execute(
    `
      SELECT
        e.*,
        v.registration_number,
        u.name AS created_by_name
      FROM expenses e
      INNER JOIN vehicles v ON v.id = e.vehicle_id
      INNER JOIN users u ON u.id = e.created_by
      ${whereClause}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `,
    parameters
  );

  res.status(200).json({
    success: true,
    message: "Expenses retrieved successfully",
    data: expenses,
  });
});

const createExpense = asyncHandler(async (req, res) => {
  const {
    vehicle_id,
    trip_id = null,
    expense_type,
    description,
    amount,
    expense_date,
  } = req.body;

  if (
    !vehicle_id ||
    !expense_type ||
    !description ||
    amount === undefined ||
    !expense_date
  ) {
    throw createError(
      400,
      "Vehicle, expense type, description, amount and date are required"
    );
  }

  if (!expenseTypes.includes(expense_type)) {
    throw createError(400, "Invalid expense type");
  }

  if (Number(amount) <= 0) {
    throw createError(
      400,
      "Expense amount must be greater than zero"
    );
  }

  if (trip_id) {
    const [trips] = await db.execute(
      `
        SELECT id
        FROM trips
        WHERE id = ?
          AND vehicle_id = ?
      `,
      [trip_id, vehicle_id]
    );

    if (trips.length === 0) {
      throw createError(
        400,
        "The selected trip does not belong to the selected vehicle"
      );
    }
  }

  const [result] = await db.execute(
    `
      INSERT INTO expenses (
        vehicle_id,
        trip_id,
        expense_type,
        description,
        amount,
        expense_date,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      vehicle_id,
      trip_id || null,
      expense_type,
      description.trim(),
      Number(amount),
      expense_date,
      req.user.id,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Expense created successfully",
    data: {
      id: result.insertId,
    },
  });
});

const updateExpense = asyncHandler(async (req, res) => {
  const expenseId = Number(req.params.id);

  const allowedFields = [
    "vehicle_id",
    "trip_id",
    "expense_type",
    "description",
    "amount",
    "expense_date",
  ];

  const updateParts = [];
  const parameters = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (
        field === "expense_type" &&
        !expenseTypes.includes(req.body[field])
      ) {
        throw createError(400, "Invalid expense type");
      }

      if (
        field === "amount" &&
        Number(req.body[field]) <= 0
      ) {
        throw createError(
          400,
          "Expense amount must be greater than zero"
        );
      }

      updateParts.push(`${field} = ?`);
      parameters.push(req.body[field] || null);
    }
  }

  if (updateParts.length === 0) {
    throw createError(
      400,
      "No expense fields were provided"
    );
  }

  parameters.push(expenseId);

  const [result] = await db.execute(
    `
      UPDATE expenses
      SET ${updateParts.join(", ")}
      WHERE id = ?
    `,
    parameters
  );

  if (result.affectedRows === 0) {
    throw createError(404, "Expense not found");
  }

  res.status(200).json({
    success: true,
    message: "Expense updated successfully",
    data: {
      id: expenseId,
    },
  });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const expenseId = Number(req.params.id);

  const [result] = await db.execute(
    "DELETE FROM expenses WHERE id = ?",
    [expenseId]
  );

  if (result.affectedRows === 0) {
    throw createError(404, "Expense not found");
  }

  res.status(200).json({
    success: true,
    message: "Expense deleted successfully",
    data: null,
  });
});

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};