const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateTripVehicle = async (
  vehicleId,
  tripId
) => {
  if (!tripId) {
    return;
  }

  const [trips] = await db.execute(
    `
      SELECT id
      FROM trips
      WHERE id = ?
        AND vehicle_id = ?
      LIMIT 1
    `,
    [tripId, vehicleId]
  );

  if (trips.length === 0) {
    throw createError(
      400,
      "The selected trip does not belong to the selected vehicle"
    );
  }
};

const getFuelLogs = asyncHandler(async (req, res) => {
  const {
    vehicle_id,
    trip_id,
    date_from,
    date_to,
  } = req.query;

  const conditions = [];
  const parameters = [];

  if (vehicle_id) {
    conditions.push("f.vehicle_id = ?");
    parameters.push(vehicle_id);
  }

  if (trip_id) {
    conditions.push("f.trip_id = ?");
    parameters.push(trip_id);
  }

  if (date_from) {
    conditions.push("f.fuel_date >= ?");
    parameters.push(date_from);
  }

  if (date_to) {
    conditions.push("f.fuel_date <= ?");
    parameters.push(date_to);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const [logs] = await db.execute(
    `
      SELECT
        f.*,
        v.registration_number,
        u.name AS created_by_name
      FROM fuel_logs f
      INNER JOIN vehicles v ON v.id = f.vehicle_id
      INNER JOIN users u ON u.id = f.created_by
      ${whereClause}
      ORDER BY f.fuel_date DESC, f.created_at DESC
    `,
    parameters
  );

  res.status(200).json({
    success: true,
    message: "Fuel logs retrieved successfully",
    data: logs,
  });
});

const createFuelLog = asyncHandler(async (req, res) => {
  const {
    vehicle_id,
    trip_id = null,
    liters,
    cost,
    fuel_date,
    odometer_reading,
  } = req.body;

  if (
    !vehicle_id ||
    liters === undefined ||
    cost === undefined ||
    !fuel_date ||
    odometer_reading === undefined
  ) {
    throw createError(
      400,
      "Vehicle, liters, cost, fuel date and odometer reading are required"
    );
  }

  if (Number(liters) <= 0) {
    throw createError(
      400,
      "Fuel liters must be greater than zero"
    );
  }

  if (Number(cost) < 0) {
    throw createError(400, "Fuel cost cannot be negative");
  }

  if (Number(odometer_reading) < 0) {
    throw createError(
      400,
      "Odometer reading cannot be negative"
    );
  }

  const [vehicles] = await db.execute(
    "SELECT id FROM vehicles WHERE id = ?",
    [vehicle_id]
  );

  if (vehicles.length === 0) {
    throw createError(404, "Vehicle not found");
  }

  await validateTripVehicle(vehicle_id, trip_id);

  const [result] = await db.execute(
    `
      INSERT INTO fuel_logs (
        vehicle_id,
        trip_id,
        liters,
        cost,
        fuel_date,
        odometer_reading,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      vehicle_id,
      trip_id || null,
      Number(liters),
      Number(cost),
      fuel_date,
      Number(odometer_reading),
      req.user.id,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Fuel log created successfully",
    data: {
      id: result.insertId,
    },
  });
});

const updateFuelLog = asyncHandler(async (req, res) => {
  const fuelId = Number(req.params.id);

  const allowedFields = [
    "vehicle_id",
    "trip_id",
    "liters",
    "cost",
    "fuel_date",
    "odometer_reading",
  ];

  const updateParts = [];
  const parameters = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (
        field === "liters" &&
        Number(req.body[field]) <= 0
      ) {
        throw createError(
          400,
          "Fuel liters must be greater than zero"
        );
      }

      if (
        (field === "cost" ||
          field === "odometer_reading") &&
        Number(req.body[field]) < 0
      ) {
        throw createError(
          400,
          `${field} cannot be negative`
        );
      }

      updateParts.push(`${field} = ?`);
      parameters.push(req.body[field] || null);
    }
  }

  if (updateParts.length === 0) {
    throw createError(400, "No fuel fields were provided");
  }

  parameters.push(fuelId);

  const [result] = await db.execute(
    `
      UPDATE fuel_logs
      SET ${updateParts.join(", ")}
      WHERE id = ?
    `,
    parameters
  );

  if (result.affectedRows === 0) {
    throw createError(404, "Fuel log not found");
  }

  res.status(200).json({
    success: true,
    message: "Fuel log updated successfully",
    data: {
      id: fuelId,
    },
  });
});

const deleteFuelLog = asyncHandler(async (req, res) => {
  const fuelId = Number(req.params.id);

  const [result] = await db.execute(
    "DELETE FROM fuel_logs WHERE id = ?",
    [fuelId]
  );

  if (result.affectedRows === 0) {
    throw createError(404, "Fuel log not found");
  }

  res.status(200).json({
    success: true,
    message: "Fuel log deleted successfully",
    data: null,
  });
});

module.exports = {
  getFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
};