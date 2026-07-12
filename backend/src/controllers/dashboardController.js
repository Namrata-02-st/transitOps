const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const buildVehicleFilter = (query, alias = "v") => {
  const conditions = [];
  const parameters = [];

  if (query.vehicle_type) {
    conditions.push(`${alias}.vehicle_type = ?`);
    parameters.push(query.vehicle_type);
  }

  if (query.status) {
    conditions.push(`${alias}.status = ?`);
    parameters.push(query.status);
  }

  if (query.region) {
    conditions.push(`${alias}.region = ?`);
    parameters.push(query.region);
  }

  return {
    whereClause:
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "",
    parameters,
  };
};

const getKpis = asyncHandler(async (req, res) => {
  const { whereClause, parameters } =
    buildVehicleFilter(req.query);

  const [rows] = await db.execute(
    `
      WITH filtered_vehicles AS (
        SELECT v.*
        FROM vehicles v
        ${whereClause}
      )
      SELECT
        (SELECT COUNT(*) FROM filtered_vehicles)
          AS total_vehicles,

        (
          SELECT COUNT(*)
          FROM filtered_vehicles
          WHERE status = 'Available'
        ) AS available_vehicles,

        (
          SELECT COUNT(*)
          FROM filtered_vehicles
          WHERE status = 'On Trip'
        ) AS vehicles_on_trip,

        (
          SELECT COUNT(*)
          FROM filtered_vehicles
          WHERE status = 'In Shop'
        ) AS vehicles_in_shop,

        (
          SELECT COUNT(*)
          FROM trips t
          INNER JOIN filtered_vehicles fv
            ON fv.id = t.vehicle_id
          WHERE t.status = 'Dispatched'
        ) AS active_trips,

        (
          SELECT COUNT(*)
          FROM trips t
          INNER JOIN filtered_vehicles fv
            ON fv.id = t.vehicle_id
          WHERE t.status = 'Draft'
        ) AS pending_trips,

        (
          SELECT COUNT(*)
          FROM drivers
          WHERE status = 'Available'
        ) AS available_drivers,

        (
          SELECT COUNT(*)
          FROM drivers
          WHERE status = 'On Trip'
        ) AS drivers_on_duty,

        (
          SELECT COALESCE(SUM(f.cost), 0)
          FROM fuel_logs f
          INNER JOIN filtered_vehicles fv
            ON fv.id = f.vehicle_id
        ) AS total_fuel_cost,

        (
          SELECT COALESCE(SUM(m.cost), 0)
          FROM maintenance_logs m
          INNER JOIN filtered_vehicles fv
            ON fv.id = m.vehicle_id
          WHERE m.status <> 'Cancelled'
        ) AS total_maintenance_cost,

        (
          (
            SELECT COALESCE(SUM(f.cost), 0)
            FROM fuel_logs f
            INNER JOIN filtered_vehicles fv
              ON fv.id = f.vehicle_id
          )
          +
          (
            SELECT COALESCE(SUM(m.cost), 0)
            FROM maintenance_logs m
            INNER JOIN filtered_vehicles fv
              ON fv.id = m.vehicle_id
            WHERE m.status <> 'Cancelled'
          )
          +
          (
            SELECT COALESCE(SUM(e.amount), 0)
            FROM expenses e
            INNER JOIN filtered_vehicles fv
              ON fv.id = e.vehicle_id
          )
        ) AS total_operational_cost,

        ROUND(
          (
            SELECT COUNT(*)
            FROM filtered_vehicles
            WHERE status = 'On Trip'
          )
          /
          NULLIF(
            (
              SELECT COUNT(*)
              FROM filtered_vehicles
              WHERE status <> 'Retired'
            ),
            0
          )
          * 100,
          2
        ) AS fleet_utilization_percentage
    `,
    parameters
  );

  res.status(200).json({
    success: true,
    message: "Dashboard KPIs retrieved successfully",
    data: rows[0],
  });
});

const getVehicleStatus = asyncHandler(
  async (req, res) => {
    const { whereClause, parameters } =
      buildVehicleFilter(req.query);

    const [rows] = await db.execute(
      `
        SELECT
          v.status,
          COUNT(*) AS total
        FROM vehicles v
        ${whereClause}
        GROUP BY v.status
        ORDER BY v.status
      `,
      parameters
    );

    res.status(200).json({
      success: true,
      message: "Vehicle status data retrieved successfully",
      data: rows,
    });
  }
);

const getExpenseSummary = asyncHandler(
  async (req, res) => {
    const [rows] = await db.execute(
      `
        SELECT
          summary.month,
          SUM(summary.fuel_cost) AS fuel_cost,
          SUM(summary.maintenance_cost)
            AS maintenance_cost,
          SUM(summary.other_expenses)
            AS other_expenses,
          SUM(
            summary.fuel_cost +
            summary.maintenance_cost +
            summary.other_expenses
          ) AS total_cost
        FROM (
          SELECT
            DATE_FORMAT(fuel_date, '%Y-%m') AS month,
            SUM(cost) AS fuel_cost,
            0 AS maintenance_cost,
            0 AS other_expenses
          FROM fuel_logs
          GROUP BY DATE_FORMAT(fuel_date, '%Y-%m')

          UNION ALL

          SELECT
            DATE_FORMAT(start_date, '%Y-%m') AS month,
            0 AS fuel_cost,
            SUM(cost) AS maintenance_cost,
            0 AS other_expenses
          FROM maintenance_logs
          WHERE status <> 'Cancelled'
          GROUP BY DATE_FORMAT(start_date, '%Y-%m')

          UNION ALL

          SELECT
            DATE_FORMAT(expense_date, '%Y-%m') AS month,
            0 AS fuel_cost,
            0 AS maintenance_cost,
            SUM(amount) AS other_expenses
          FROM expenses
          GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
        ) summary
        GROUP BY summary.month
        ORDER BY summary.month DESC
        LIMIT 12
      `
    );

    res.status(200).json({
      success: true,
      message: "Expense summary retrieved successfully",
      data: rows.reverse(),
    });
  }
);

const getRecentTrips = asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit || 5);
  const limit = Math.min(Math.max(requestedLimit, 1), 20);

  const [rows] = await db.query(
    `
      SELECT
        t.id,
        t.source,
        t.destination,
        t.status,
        t.dispatch_date,
        t.completion_date,
        v.registration_number,
        d.name AS driver_name
      FROM trips t
      INNER JOIN vehicles v ON v.id = t.vehicle_id
      INNER JOIN drivers d ON d.id = t.driver_id
      ORDER BY t.created_at DESC
      LIMIT ${limit}
    `
  );

  res.status(200).json({
    success: true,
    message: "Recent trips retrieved successfully",
    data: rows,
  });
});

module.exports = {
  getKpis,
  getVehicleStatus,
  getExpenseSummary,
  getRecentTrips,
};