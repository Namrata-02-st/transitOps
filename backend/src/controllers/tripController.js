const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateTripResources = async (
  connection,
  trip,
  excludedTripId = null
) => {
  const [vehicles] = await connection.execute(
    `
      SELECT *
      FROM vehicles
      WHERE id = ?
      FOR UPDATE
    `,
    [trip.vehicle_id]
  );

  if (vehicles.length === 0) {
    throw createError(404, "Selected vehicle does not exist");
  }

  const vehicle = vehicles[0];

  if (vehicle.status !== "Available") {
    throw createError(
      409,
      `Vehicle is currently ${vehicle.status}`
    );
  }

  const [drivers] = await connection.execute(
    `
      SELECT *
      FROM drivers
      WHERE id = ?
      FOR UPDATE
    `,
    [trip.driver_id]
  );

  if (drivers.length === 0) {
    throw createError(404, "Selected driver does not exist");
  }

  const driver = drivers[0];

  if (driver.status !== "Available") {
    throw createError(
      409,
      `Driver is currently ${driver.status}`
    );
  }

  const expiryDate = new Date(driver.license_expiry_date);
  expiryDate.setHours(23, 59, 59, 999);

  if (expiryDate < new Date()) {
    throw createError(
      409,
      "Driver licence has expired"
    );
  }

  if (
    Number(trip.cargo_weight) >
    Number(vehicle.maximum_load_capacity)
  ) {
    throw createError(
      409,
      "Cargo weight exceeds vehicle maximum load capacity"
    );
  }

  let tripCondition = "";
  const parameters = [
    trip.vehicle_id,
    trip.driver_id,
  ];

  if (excludedTripId) {
    tripCondition = "AND id <> ?";
    parameters.push(excludedTripId);
  }

  const [activeTrips] = await connection.execute(
    `
      SELECT id
      FROM trips
      WHERE status = 'Dispatched'
        AND (vehicle_id = ? OR driver_id = ?)
        ${tripCondition}
      LIMIT 1
      FOR UPDATE
    `,
    parameters
  );

  if (activeTrips.length > 0) {
    throw createError(
      409,
      "Vehicle or driver is already assigned to an active trip"
    );
  }

  return {
    vehicle,
    driver,
  };
};

const getTrips = asyncHandler(async (req, res) => {
  const { search, status, vehicle_id, driver_id } = req.query;

  const conditions = [];
  const parameters = [];

  if (search) {
    conditions.push(
      "(t.source LIKE ? OR t.destination LIKE ? OR v.registration_number LIKE ? OR d.name LIKE ?)"
    );

    const value = `%${search.trim()}%`;
    parameters.push(value, value, value, value);
  }

  if (status) {
    conditions.push("t.status = ?");
    parameters.push(status);
  }

  if (vehicle_id) {
    conditions.push("t.vehicle_id = ?");
    parameters.push(vehicle_id);
  }

  if (driver_id) {
    conditions.push("t.driver_id = ?");
    parameters.push(driver_id);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const [trips] = await db.execute(
    `
      SELECT
        t.*,
        v.registration_number,
        v.vehicle_name,
        d.name AS driver_name,
        u.name AS created_by_name
      FROM trips t
      INNER JOIN vehicles v ON v.id = t.vehicle_id
      INNER JOIN drivers d ON d.id = t.driver_id
      INNER JOIN users u ON u.id = t.created_by
      ${whereClause}
      ORDER BY t.created_at DESC
    `,
    parameters
  );

  res.status(200).json({
    success: true,
    message: "Trips retrieved successfully",
    data: trips,
  });
});

const getTripById = asyncHandler(async (req, res) => {
  const tripId = Number(req.params.id);

  const [trips] = await db.execute(
    `
      SELECT
        t.*,
        v.registration_number,
        v.vehicle_name,
        v.maximum_load_capacity,
        d.name AS driver_name,
        d.license_number,
        d.license_expiry_date,
        u.name AS created_by_name
      FROM trips t
      INNER JOIN vehicles v ON v.id = t.vehicle_id
      INNER JOIN drivers d ON d.id = t.driver_id
      INNER JOIN users u ON u.id = t.created_by
      WHERE t.id = ?
      LIMIT 1
    `,
    [tripId]
  );

  if (trips.length === 0) {
    throw createError(404, "Trip not found");
  }

  res.status(200).json({
    success: true,
    message: "Trip retrieved successfully",
    data: trips[0],
  });
});

const createTrip = asyncHandler(async (req, res) => {
  const {
    source,
    destination,
    vehicle_id,
    driver_id,
    cargo_weight,
    planned_distance,
    starting_odometer,
    revenue = 0,
  } = req.body;

  if (
    !source ||
    !destination ||
    !vehicle_id ||
    !driver_id ||
    cargo_weight === undefined ||
    planned_distance === undefined
  ) {
    throw createError(
      400,
      "Source, destination, vehicle, driver, cargo weight and planned distance are required"
    );
  }

  if (Number(cargo_weight) < 0) {
    throw createError(400, "Cargo weight cannot be negative");
  }

  if (Number(planned_distance) <= 0) {
    throw createError(
      400,
      "Planned distance must be greater than zero"
    );
  }

  if (Number(revenue) < 0) {
    throw createError(400, "Revenue cannot be negative");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const tripData = {
      vehicle_id: Number(vehicle_id),
      driver_id: Number(driver_id),
      cargo_weight: Number(cargo_weight),
    };

    const { vehicle } = await validateTripResources(
      connection,
      tripData
    );

    const tripStartingOdometer =
      starting_odometer === undefined ||
      starting_odometer === null ||
      starting_odometer === ""
        ? Number(vehicle.odometer)
        : Number(starting_odometer);

    if (
      tripStartingOdometer < Number(vehicle.odometer)
    ) {
      throw createError(
        400,
        "Starting odometer cannot be lower than the current vehicle odometer"
      );
    }

    const [result] = await connection.execute(
      `
        INSERT INTO trips (
          source,
          destination,
          vehicle_id,
          driver_id,
          cargo_weight,
          planned_distance,
          starting_odometer,
          revenue,
          status,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)
      `,
      [
        source.trim(),
        destination.trim(),
        Number(vehicle_id),
        Number(driver_id),
        Number(cargo_weight),
        Number(planned_distance),
        tripStartingOdometer,
        Number(revenue),
        req.user.id,
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Trip created as Draft successfully",
      data: {
        id: result.insertId,
        status: "Draft",
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const dispatchTrip = asyncHandler(async (req, res) => {
  const tripId = Number(req.params.id);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [trips] = await connection.execute(
      `
        SELECT *
        FROM trips
        WHERE id = ?
        FOR UPDATE
      `,
      [tripId]
    );

    if (trips.length === 0) {
      throw createError(404, "Trip not found");
    }

    const trip = trips[0];

    if (trip.status !== "Draft") {
      throw createError(
        409,
        "Only Draft trips can be dispatched"
      );
    }

    await validateTripResources(
      connection,
      trip,
      tripId
    );

    await connection.execute(
      `
        UPDATE trips
        SET
          status = 'Dispatched',
          dispatch_date = NOW()
        WHERE id = ?
      `,
      [tripId]
    );

    await connection.execute(
      `
        UPDATE vehicles
        SET status = 'On Trip'
        WHERE id = ?
      `,
      [trip.vehicle_id]
    );

    await connection.execute(
      `
        UPDATE drivers
        SET status = 'On Trip'
        WHERE id = ?
      `,
      [trip.driver_id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Trip dispatched successfully",
      data: {
        id: tripId,
        status: "Dispatched",
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const completeTrip = asyncHandler(async (req, res) => {
  const tripId = Number(req.params.id);
  const { final_odometer } = req.body;

  if (final_odometer === undefined) {
    throw createError(400, "Final odometer is required");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [trips] = await connection.execute(
      `
        SELECT *
        FROM trips
        WHERE id = ?
        FOR UPDATE
      `,
      [tripId]
    );

    if (trips.length === 0) {
      throw createError(404, "Trip not found");
    }

    const trip = trips[0];

    if (trip.status !== "Dispatched") {
      throw createError(
        409,
        "Only dispatched trips can be completed"
      );
    }

    const finalOdometer = Number(final_odometer);
    const startingOdometer = Number(
      trip.starting_odometer
    );

    if (finalOdometer < startingOdometer) {
      throw createError(
        400,
        "Final odometer cannot be lower than starting odometer"
      );
    }

    const actualDistance =
      finalOdometer - startingOdometer;

    await connection.execute(
      `
        UPDATE trips
        SET
          final_odometer = ?,
          actual_distance = ?,
          status = 'Completed',
          completion_date = NOW()
        WHERE id = ?
      `,
      [finalOdometer, actualDistance, tripId]
    );

    await connection.execute(
      `
        UPDATE vehicles
        SET
          odometer = ?,
          status = CASE
            WHEN status = 'Retired' THEN 'Retired'
            ELSE 'Available'
          END
        WHERE id = ?
      `,
      [finalOdometer, trip.vehicle_id]
    );

    await connection.execute(
      `
        UPDATE drivers
        SET status = CASE
          WHEN status = 'Suspended' THEN 'Suspended'
          ELSE 'Available'
        END
        WHERE id = ?
      `,
      [trip.driver_id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Trip completed successfully",
      data: {
        id: tripId,
        status: "Completed",
        actual_distance: actualDistance,
        final_odometer: finalOdometer,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const cancelTrip = asyncHandler(async (req, res) => {
  const tripId = Number(req.params.id);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [trips] = await connection.execute(
      `
        SELECT *
        FROM trips
        WHERE id = ?
        FOR UPDATE
      `,
      [tripId]
    );

    if (trips.length === 0) {
      throw createError(404, "Trip not found");
    }

    const trip = trips[0];

    if (
      trip.status === "Completed" ||
      trip.status === "Cancelled"
    ) {
      throw createError(
        409,
        "Completed or cancelled trips cannot be cancelled"
      );
    }

    await connection.execute(
      `
        UPDATE trips
        SET status = 'Cancelled'
        WHERE id = ?
      `,
      [tripId]
    );

    if (trip.status === "Dispatched") {
      await connection.execute(
        `
          UPDATE vehicles
          SET status = CASE
            WHEN status = 'On Trip' THEN 'Available'
            ELSE status
          END
          WHERE id = ?
        `,
        [trip.vehicle_id]
      );

      await connection.execute(
        `
          UPDATE drivers
          SET status = CASE
            WHEN status = 'On Trip' THEN 'Available'
            ELSE status
          END
          WHERE id = ?
        `,
        [trip.driver_id]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Trip cancelled successfully",
      data: {
        id: tripId,
        status: "Cancelled",
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};