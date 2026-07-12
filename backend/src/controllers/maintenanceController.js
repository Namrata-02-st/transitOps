const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getMaintenanceRecords = asyncHandler(
  async (req, res) => {
    const { status, vehicle_id } = req.query;

    const conditions = [];
    const parameters = [];

    if (status) {
      conditions.push("m.status = ?");
      parameters.push(status);
    }

    if (vehicle_id) {
      conditions.push("m.vehicle_id = ?");
      parameters.push(vehicle_id);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [records] = await db.execute(
      `
        SELECT
          m.*,
          v.registration_number,
          v.vehicle_name,
          u.name AS created_by_name
        FROM maintenance_logs m
        INNER JOIN vehicles v ON v.id = m.vehicle_id
        INNER JOIN users u ON u.id = m.created_by
        ${whereClause}
        ORDER BY m.created_at DESC
      `,
      parameters
    );

    res.status(200).json({
      success: true,
      message: "Maintenance records retrieved successfully",
      data: records,
    });
  }
);

const getMaintenanceById = asyncHandler(
  async (req, res) => {
    const maintenanceId = Number(req.params.id);

    const [records] = await db.execute(
      `
        SELECT
          m.*,
          v.registration_number,
          v.vehicle_name,
          u.name AS created_by_name
        FROM maintenance_logs m
        INNER JOIN vehicles v ON v.id = m.vehicle_id
        INNER JOIN users u ON u.id = m.created_by
        WHERE m.id = ?
        LIMIT 1
      `,
      [maintenanceId]
    );

    if (records.length === 0) {
      throw createError(
        404,
        "Maintenance record not found"
      );
    }

    res.status(200).json({
      success: true,
      message: "Maintenance record retrieved successfully",
      data: records[0],
    });
  }
);

const createMaintenance = asyncHandler(
  async (req, res) => {
    const {
      vehicle_id,
      maintenance_type,
      description,
      priority,
      start_date,
      cost = 0,
    } = req.body;

    if (
      !vehicle_id ||
      !maintenance_type ||
      !description ||
      !priority ||
      !start_date
    ) {
      throw createError(
        400,
        "Vehicle, maintenance type, description, priority and start date are required"
      );
    }

    if (Number(cost) < 0) {
      throw createError(
        400,
        "Maintenance cost cannot be negative"
      );
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [vehicles] = await connection.execute(
        `
          SELECT *
          FROM vehicles
          WHERE id = ?
          FOR UPDATE
        `,
        [vehicle_id]
      );

      if (vehicles.length === 0) {
        throw createError(404, "Vehicle not found");
      }

      const vehicle = vehicles[0];

      if (vehicle.status === "Retired") {
        throw createError(
          409,
          "Retired vehicles cannot enter maintenance"
        );
      }

      if (vehicle.status === "On Trip") {
        throw createError(
          409,
          "A vehicle currently on a trip cannot enter maintenance"
        );
      }

      const [activeMaintenance] =
        await connection.execute(
          `
            SELECT id
            FROM maintenance_logs
            WHERE vehicle_id = ?
              AND status = 'Active'
            LIMIT 1
            FOR UPDATE
          `,
          [vehicle_id]
        );

      if (activeMaintenance.length > 0) {
        throw createError(
          409,
          "Vehicle already has active maintenance"
        );
      }

      const [result] = await connection.execute(
        `
          INSERT INTO maintenance_logs (
            vehicle_id,
            maintenance_type,
            description,
            priority,
            start_date,
            cost,
            status,
            created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, 'Active', ?)
        `,
        [
          vehicle_id,
          maintenance_type,
          description.trim(),
          priority,
          start_date,
          Number(cost),
          req.user.id,
        ]
      );

      await connection.execute(
        `
          UPDATE vehicles
          SET status = 'In Shop'
          WHERE id = ?
        `,
        [vehicle_id]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Maintenance record created successfully",
        data: {
          id: result.insertId,
          vehicle_id: Number(vehicle_id),
          status: "Active",
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
);

const completeMaintenance = asyncHandler(
  async (req, res) => {
    const maintenanceId = Number(req.params.id);
    const { end_date, cost } = req.body;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [records] = await connection.execute(
        `
          SELECT *
          FROM maintenance_logs
          WHERE id = ?
          FOR UPDATE
        `,
        [maintenanceId]
      );

      if (records.length === 0) {
        throw createError(
          404,
          "Maintenance record not found"
        );
      }

      const record = records[0];

      if (record.status !== "Active") {
        throw createError(
          409,
          "Only active maintenance can be completed"
        );
      }

      const finalCost =
        cost === undefined ? record.cost : Number(cost);

      if (finalCost < 0) {
        throw createError(
          400,
          "Maintenance cost cannot be negative"
        );
      }

      await connection.execute(
        `
          UPDATE maintenance_logs
          SET
            status = 'Completed',
            end_date = COALESCE(?, CURDATE()),
            cost = ?
          WHERE id = ?
        `,
        [end_date || null, finalCost, maintenanceId]
      );

      const [otherActiveRecords] =
        await connection.execute(
          `
            SELECT id
            FROM maintenance_logs
            WHERE vehicle_id = ?
              AND status = 'Active'
              AND id <> ?
            LIMIT 1
          `,
          [record.vehicle_id, maintenanceId]
        );

      if (otherActiveRecords.length === 0) {
        await connection.execute(
          `
            UPDATE vehicles
            SET status = CASE
              WHEN status = 'Retired'
                THEN 'Retired'
              ELSE 'Available'
            END
            WHERE id = ?
          `,
          [record.vehicle_id]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Maintenance completed successfully",
        data: {
          id: maintenanceId,
          status: "Completed",
          cost: finalCost,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
);

const cancelMaintenance = asyncHandler(
  async (req, res) => {
    const maintenanceId = Number(req.params.id);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [records] = await connection.execute(
        `
          SELECT *
          FROM maintenance_logs
          WHERE id = ?
          FOR UPDATE
        `,
        [maintenanceId]
      );

      if (records.length === 0) {
        throw createError(
          404,
          "Maintenance record not found"
        );
      }

      const record = records[0];

      if (record.status !== "Active") {
        throw createError(
          409,
          "Only active maintenance can be cancelled"
        );
      }

      await connection.execute(
        `
          UPDATE maintenance_logs
          SET
            status = 'Cancelled',
            end_date = CURDATE()
          WHERE id = ?
        `,
        [maintenanceId]
      );

      const [otherActiveRecords] =
        await connection.execute(
          `
            SELECT id
            FROM maintenance_logs
            WHERE vehicle_id = ?
              AND status = 'Active'
              AND id <> ?
            LIMIT 1
          `,
          [record.vehicle_id, maintenanceId]
        );

      if (otherActiveRecords.length === 0) {
        await connection.execute(
          `
            UPDATE vehicles
            SET status = CASE
              WHEN status = 'Retired'
                THEN 'Retired'
              ELSE 'Available'
            END
            WHERE id = ?
          `,
          [record.vehicle_id]
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Maintenance cancelled successfully",
        data: {
          id: maintenanceId,
          status: "Cancelled",
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
);

module.exports = {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenance,
  completeMaintenance,
  cancelMaintenance,
};