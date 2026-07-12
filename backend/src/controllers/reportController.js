const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const vehicleCostQuery = `
  SELECT
    v.id AS vehicle_id,
    v.registration_number,
    v.vehicle_name,

    COALESCE(fuel.total_fuel_cost, 0)
      AS fuel_cost,

    COALESCE(maintenance.total_maintenance_cost, 0)
      AS maintenance_cost,

    COALESCE(expense.total_other_expenses, 0)
      AS other_expenses,

    (
      COALESCE(fuel.total_fuel_cost, 0)
      +
      COALESCE(maintenance.total_maintenance_cost, 0)
      +
      COALESCE(expense.total_other_expenses, 0)
    ) AS operational_cost,

    COALESCE(trip_data.total_trips, 0)
      AS total_trips

  FROM vehicles v

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(cost) AS total_fuel_cost
    FROM fuel_logs
    GROUP BY vehicle_id
  ) fuel ON fuel.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(cost) AS total_maintenance_cost
    FROM maintenance_logs
    WHERE status <> 'Cancelled'
    GROUP BY vehicle_id
  ) maintenance ON maintenance.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(amount) AS total_other_expenses
    FROM expenses
    GROUP BY vehicle_id
  ) expense ON expense.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      COUNT(*) AS total_trips
    FROM trips
    GROUP BY vehicle_id
  ) trip_data ON trip_data.vehicle_id = v.id

  ORDER BY operational_cost DESC
`;

const fuelEfficiencyQuery = `
  SELECT
    v.id AS vehicle_id,
    v.registration_number,
    v.vehicle_name,

    COALESCE(trip_data.total_distance, 0)
      AS total_distance,

    COALESCE(fuel_data.total_liters, 0)
      AS total_fuel_liters,

    ROUND(
      COALESCE(trip_data.total_distance, 0)
      /
      NULLIF(
        COALESCE(fuel_data.total_liters, 0),
        0
      ),
      2
    ) AS fuel_efficiency

  FROM vehicles v

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(actual_distance) AS total_distance
    FROM trips
    WHERE status = 'Completed'
    GROUP BY vehicle_id
  ) trip_data ON trip_data.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(liters) AS total_liters
    FROM fuel_logs
    GROUP BY vehicle_id
  ) fuel_data ON fuel_data.vehicle_id = v.id

  ORDER BY fuel_efficiency DESC
`;

const vehicleRoiQuery = `
  SELECT
    v.id AS vehicle_id,
    v.registration_number,
    v.vehicle_name,
    v.acquisition_cost,

    COALESCE(revenue_data.total_revenue, 0)
      AS total_revenue,

    (
      COALESCE(fuel_data.fuel_cost, 0)
      +
      COALESCE(maintenance_data.maintenance_cost, 0)
      +
      COALESCE(expense_data.expense_cost, 0)
    ) AS operational_cost,

    ROUND(
      (
        COALESCE(revenue_data.total_revenue, 0)
        -
        (
          COALESCE(fuel_data.fuel_cost, 0)
          +
          COALESCE(
            maintenance_data.maintenance_cost,
            0
          )
          +
          COALESCE(expense_data.expense_cost, 0)
        )
      )
      /
      NULLIF(v.acquisition_cost, 0)
      * 100,
      2
    ) AS roi_percentage

  FROM vehicles v

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(revenue) AS total_revenue
    FROM trips
    WHERE status = 'Completed'
    GROUP BY vehicle_id
  ) revenue_data ON revenue_data.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(cost) AS fuel_cost
    FROM fuel_logs
    GROUP BY vehicle_id
  ) fuel_data ON fuel_data.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(cost) AS maintenance_cost
    FROM maintenance_logs
    WHERE status <> 'Cancelled'
    GROUP BY vehicle_id
  ) maintenance_data
    ON maintenance_data.vehicle_id = v.id

  LEFT JOIN (
    SELECT
      vehicle_id,
      SUM(amount) AS expense_cost
    FROM expenses
    GROUP BY vehicle_id
  ) expense_data ON expense_data.vehicle_id = v.id

  ORDER BY roi_percentage DESC
`;

const getVehicleCosts = asyncHandler(async (req, res) => {
  const [rows] = await db.query(vehicleCostQuery);

  res.status(200).json({
    success: true,
    message: "Vehicle cost report retrieved successfully",
    data: rows,
  });
});

const getFuelEfficiency = asyncHandler(
  async (req, res) => {
    const [rows] = await db.query(fuelEfficiencyQuery);

    res.status(200).json({
      success: true,
      message: "Fuel efficiency report retrieved successfully",
      data: rows,
    });
  }
);

const getFleetUtilization = asyncHandler(
  async (req, res) => {
    const [rows] = await db.query(
      `
        SELECT
          COUNT(*) AS total_active_vehicles,

          SUM(
            CASE
              WHEN status = 'On Trip' THEN 1
              ELSE 0
            END
          ) AS vehicles_on_trip,

          ROUND(
            SUM(
              CASE
                WHEN status = 'On Trip' THEN 1
                ELSE 0
              END
            )
            /
            NULLIF(COUNT(*), 0)
            * 100,
            2
          ) AS fleet_utilization_percentage

        FROM vehicles
        WHERE status <> 'Retired'
      `
    );

    res.status(200).json({
      success: true,
      message: "Fleet utilization retrieved successfully",
      data: rows[0],
    });
  }
);

const getVehicleRoi = asyncHandler(async (req, res) => {
  const [rows] = await db.query(vehicleRoiQuery);

  res.status(200).json({
    success: true,
    message: "Vehicle ROI report retrieved successfully",
    data: rows,
  });
});

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }

  return `"${String(value).replace(/"/g, '""')}"`;
};

const convertRowsToCsv = (rows) => {
  if (rows.length === 0) {
    return "No data";
  }

  const headers = Object.keys(rows[0]);

  const csvLines = [
    headers.map(escapeCsvValue).join(","),
  ];

  for (const row of rows) {
    csvLines.push(
      headers
        .map((header) => escapeCsvValue(row[header]))
        .join(",")
    );
  }

  return csvLines.join("\n");
};

const exportCsv = asyncHandler(async (req, res) => {
  const reportType = req.query.type || "vehicle-costs";

  let query;
  let filename;

  if (reportType === "vehicle-costs") {
    query = vehicleCostQuery;
    filename = "transitops-vehicle-costs.csv";
  } else if (reportType === "fuel-efficiency") {
    query = fuelEfficiencyQuery;
    filename = "transitops-fuel-efficiency.csv";
  } else if (reportType === "vehicle-roi") {
    query = vehicleRoiQuery;
    filename = "transitops-vehicle-roi.csv";
  } else {
    throw createError(
      400,
      "Invalid report type. Use vehicle-costs, fuel-efficiency or vehicle-roi"
    );
  }

  const [rows] = await db.query(query);
  const csv = convertRowsToCsv(rows);

  res.setHeader(
    "Content-Type",
    "text/csv; charset=utf-8"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  res.status(200).send(csv);
});

module.exports = {
  getVehicleCosts,
  getFuelEfficiency,
  getFleetUtilization,
  getVehicleRoi,
  exportCsv,
};