const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const driverStatuses = [
  "Available",
  "On Trip",
  "Off Duty",
  "Suspended",
];

const driverSelect = `
  SELECT
    id,
    name,
    email,
    license_number,
    license_category,
    license_expiry_date,
    contact_number,
    safety_score,
    region,
    status,
    created_at,
    updated_at,
    CASE
      WHEN license_expiry_date < CURDATE()
        THEN 'Expired'
      WHEN license_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        THEN 'Expiring Soon'
      ELSE 'Valid'
    END AS license_state
  FROM drivers
`;

const getDrivers = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    license_category,
    region,
  } = req.query;

  const conditions = [];
  const parameters = [];

  if (search) {
    conditions.push(
      "(name LIKE ? OR email LIKE ? OR license_number LIKE ? OR contact_number LIKE ?)"
    );

    const value = `%${search.trim()}%`;
    parameters.push(value, value, value, value);
  }

  if (status) {
    conditions.push("status = ?");
    parameters.push(status);
  }

  if (license_category) {
    conditions.push("license_category = ?");
    parameters.push(license_category);
  }

  if (region) {
    conditions.push("region = ?");
    parameters.push(region);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const [drivers] = await db.execute(
    `
      ${driverSelect}
      ${whereClause}
      ORDER BY created_at DESC
    `,
    parameters
  );

  res.status(200).json({
    success: true,
    message: "Drivers retrieved successfully",
    data: drivers,
  });
});

const getAvailableDrivers = asyncHandler(async (req, res) => {
  const [drivers] = await db.execute(
    `
      ${driverSelect}
      WHERE status = 'Available'
        AND license_expiry_date >= CURDATE()
      ORDER BY name
    `
  );

  res.status(200).json({
    success: true,
    message: "Available drivers retrieved successfully",
    data: drivers,
  });
});

const getDriverById = asyncHandler(async (req, res) => {
  const driverId = Number(req.params.id);

  const [drivers] = await db.execute(
    `
      ${driverSelect}
      WHERE id = ?
      LIMIT 1
    `,
    [driverId]
  );

  if (drivers.length === 0) {
    throw createError(404, "Driver not found");
  }

  res.status(200).json({
    success: true,
    message: "Driver retrieved successfully",
    data: drivers[0],
  });
});

const createDriver = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    license_number,
    license_category,
    license_expiry_date,
    contact_number,
    safety_score = 100,
    region,
    status = "Available",
  } = req.body;

  if (
    !name ||
    !email ||
    !license_number ||
    !license_category ||
    !license_expiry_date ||
    !contact_number ||
    !region
  ) {
    throw createError(
      400,
      "All required driver fields must be provided"
    );
  }

  if (
    Number(safety_score) < 0 ||
    Number(safety_score) > 100
  ) {
    throw createError(
      400,
      "Safety score must be between 0 and 100"
    );
  }

  if (!driverStatuses.includes(status)) {
    throw createError(400, "Invalid driver status");
  }

  const [result] = await db.execute(
    `
      INSERT INTO drivers (
        name,
        email,
        license_number,
        license_category,
        license_expiry_date,
        contact_number,
        safety_score,
        region,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name.trim(),
      email.trim().toLowerCase(),
      license_number.trim().toUpperCase(),
      license_category,
      license_expiry_date,
      contact_number.trim(),
      Number(safety_score),
      region.trim(),
      status,
    ]
  );

  const [drivers] = await db.execute(
    `
      ${driverSelect}
      WHERE id = ?
    `,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: "Driver created successfully",
    data: drivers[0],
  });
});

const updateDriver = asyncHandler(async (req, res) => {
  const driverId = Number(req.params.id);

  const allowedFields = [
    "name",
    "email",
    "license_number",
    "license_category",
    "license_expiry_date",
    "contact_number",
    "safety_score",
    "region",
    "status",
  ];

  const updateParts = [];
  const parameters = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (
        field === "status" &&
        !driverStatuses.includes(req.body[field])
      ) {
        throw createError(400, "Invalid driver status");
      }

      if (
        field === "safety_score" &&
        (Number(req.body[field]) < 0 ||
          Number(req.body[field]) > 100)
      ) {
        throw createError(
          400,
          "Safety score must be between 0 and 100"
        );
      }

      updateParts.push(`${field} = ?`);

      if (field === "email") {
        parameters.push(
          String(req.body[field]).trim().toLowerCase()
        );
      } else if (field === "license_number") {
        parameters.push(
          String(req.body[field]).trim().toUpperCase()
        );
      } else {
        parameters.push(req.body[field]);
      }
    }
  }

  if (updateParts.length === 0) {
    throw createError(400, "No driver fields were provided");
  }

  parameters.push(driverId);

  const [result] = await db.execute(
    `
      UPDATE drivers
      SET ${updateParts.join(", ")}
      WHERE id = ?
    `,
    parameters
  );

  if (result.affectedRows === 0) {
    throw createError(404, "Driver not found");
  }

  const [drivers] = await db.execute(
    `
      ${driverSelect}
      WHERE id = ?
    `,
    [driverId]
  );

  res.status(200).json({
    success: true,
    message: "Driver updated successfully",
    data: drivers[0],
  });
});

const suspendDriver = asyncHandler(async (req, res) => {
  const driverId = Number(req.params.id);

  const [drivers] = await db.execute(
    "SELECT status FROM drivers WHERE id = ?",
    [driverId]
  );

  if (drivers.length === 0) {
    throw createError(404, "Driver not found");
  }

  if (drivers[0].status === "On Trip") {
    throw createError(
      409,
      "A driver currently on a trip cannot be suspended"
    );
  }

  await db.execute(
    "UPDATE drivers SET status = 'Suspended' WHERE id = ?",
    [driverId]
  );

  res.status(200).json({
    success: true,
    message: "Driver suspended successfully",
    data: {
      id: driverId,
      status: "Suspended",
    },
  });
});

const deleteDriver = asyncHandler(async (req, res) => {
  const driverId = Number(req.params.id);

  const [dependencies] = await db.execute(
    "SELECT COUNT(*) AS total FROM trips WHERE driver_id = ?",
    [driverId]
  );

  if (Number(dependencies[0].total) > 0) {
    throw createError(
      409,
      "Driver cannot be deleted because trip history depends on this driver"
    );
  }

  const [result] = await db.execute(
    "DELETE FROM drivers WHERE id = ?",
    [driverId]
  );

  if (result.affectedRows === 0) {
    throw createError(404, "Driver not found");
  }

  res.status(200).json({
    success: true,
    message: "Driver deleted successfully",
    data: null,
  });
});

module.exports = {
  getDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  suspendDriver,
  deleteDriver,
};