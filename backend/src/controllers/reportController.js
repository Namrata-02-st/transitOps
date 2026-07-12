const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { Parser } = require('json2csv');

const getVehicleCosts = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`
    SELECT v.id, v.registration_number, v.vehicle_name, v.acquisition_cost,
    COALESCE(f.fuel_cost,0) as fuel_cost,
    COALESCE(m.maint_cost,0) as maintenance_cost,
    COALESCE(e.expense_cost,0) as other_expenses,
    (COALESCE(f.fuel_cost,0)+COALESCE(m.maint_cost,0)+COALESCE(e.expense_cost,0)) as total_operational_cost,
    COALESCE(tr.total_revenue,0) as total_revenue,
    COALESCE(tr.trip_count,0) as trip_count
    FROM vehicles v
    LEFT JOIN (SELECT vehicle_id, SUM(cost) as fuel_cost FROM fuel_logs GROUP BY vehicle_id) f ON v.id=f.vehicle_id
    LEFT JOIN (SELECT vehicle_id, SUM(cost) as maint_cost FROM maintenance_logs WHERE status='Completed' GROUP BY vehicle_id) m ON v.id=m.vehicle_id
    LEFT JOIN (SELECT vehicle_id, SUM(amount) as expense_cost FROM expenses GROUP BY vehicle_id) e ON v.id=e.vehicle_id
    LEFT JOIN (SELECT vehicle_id, SUM(revenue) as total_revenue, COUNT(*) as trip_count FROM trips WHERE status='Completed' GROUP BY vehicle_id) tr ON v.id=tr.vehicle_id
    ORDER BY total_operational_cost DESC`);
  res.json({ success: true, data: rows });
});

const getFuelEfficiency = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`
    SELECT v.id, v.registration_number, v.vehicle_name,
    COALESCE(SUM(t.actual_distance),0) as total_distance,
    COALESCE(f.total_liters,0) as total_fuel_liters,
    ROUND(CASE WHEN COALESCE(f.total_liters,0)=0 THEN 0
      ELSE COALESCE(SUM(t.actual_distance),0)/f.total_liters END, 2) as fuel_efficiency_km_l
    FROM vehicles v
    LEFT JOIN trips t ON v.id=t.vehicle_id AND t.status='Completed'
    LEFT JOIN (SELECT vehicle_id, SUM(liters) as total_liters FROM fuel_logs GROUP BY vehicle_id) f ON v.id=f.vehicle_id
    GROUP BY v.id ORDER BY fuel_efficiency_km_l DESC`);
  res.json({ success: true, data: rows });
});

const getFleetUtilization = asyncHandler(async (req, res) => {
  const [[stats]] = await db.execute(`SELECT
    COUNT(*) as total_vehicles,
    SUM(CASE WHEN status!='Retired' THEN 1 ELSE 0 END) as active_vehicles,
    SUM(CASE WHEN status='On Trip' THEN 1 ELSE 0 END) as on_trip,
    ROUND(SUM(CASE WHEN status='On Trip' THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN status!='Retired' THEN 1 ELSE 0 END),0)*100,2) as utilization_pct
    FROM vehicles`);
  res.json({ success: true, data: stats });
});

const getVehicleROI = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`
    SELECT v.id, v.registration_number, v.vehicle_name, v.acquisition_cost,
    COALESCE(tr.total_revenue,0) as total_revenue,
    (COALESCE(f.fuel_cost,0)+COALESCE(m.maint_cost,0)+COALESCE(e.expense_cost,0)) as operational_cost,
    ROUND(CASE WHEN COALESCE(v.acquisition_cost,0)=0 THEN 0
      ELSE ((COALESCE(tr.total_revenue,0)-(COALESCE(f.fuel_cost,0)+COALESCE(m.maint_cost,0)+COALESCE(e.expense_cost,0)))/v.acquisition_cost)*100
    END, 2) as roi_percentage
    FROM vehicles v
    LEFT JOIN (SELECT vehicle_id, SUM(revenue) as total_revenue FROM trips WHERE status='Completed' GROUP BY vehicle_id) tr ON v.id=tr.vehicle_id
    LEFT JOIN (SELECT vehicle_id, SUM(cost) as fuel_cost FROM fuel_logs GROUP BY vehicle_id) f ON v.id=f.vehicle_id
    LEFT JOIN (SELECT vehicle_id, SUM(cost) as maint_cost FROM maintenance_logs WHERE status='Completed' GROUP BY vehicle_id) m ON v.id=m.vehicle_id
    LEFT JOIN (SELECT vehicle_id, SUM(amount) as expense_cost FROM expenses GROUP BY vehicle_id) e ON v.id=e.vehicle_id
    ORDER BY roi_percentage DESC`);
  res.json({ success: true, data: rows });
});

const exportCSV = asyncHandler(async (req, res) => {
  const { report } = req.query;
  let data = [], filename = 'report';
  if (report === 'vehicle-costs') {
    const [rows] = await db.execute(`SELECT v.registration_number, v.vehicle_name, COALESCE(f.fuel_cost,0) as fuel_cost, COALESCE(m.maint_cost,0) as maintenance_cost, COALESCE(e.expense_cost,0) as other_expenses FROM vehicles v LEFT JOIN (SELECT vehicle_id, SUM(cost) as fuel_cost FROM fuel_logs GROUP BY vehicle_id) f ON v.id=f.vehicle_id LEFT JOIN (SELECT vehicle_id, SUM(cost) as maint_cost FROM maintenance_logs WHERE status='Completed' GROUP BY vehicle_id) m ON v.id=m.vehicle_id LEFT JOIN (SELECT vehicle_id, SUM(amount) as expense_cost FROM expenses GROUP BY vehicle_id) e ON v.id=e.vehicle_id`);
    data = rows; filename = 'vehicle_costs';
  } else if (report === 'fuel-efficiency') {
    const [rows] = await db.execute(`SELECT v.registration_number, v.vehicle_name, COALESCE(SUM(t.actual_distance),0) as total_distance, COALESCE(f.total_liters,0) as total_liters FROM vehicles v LEFT JOIN trips t ON v.id=t.vehicle_id AND t.status='Completed' LEFT JOIN (SELECT vehicle_id, SUM(liters) as total_liters FROM fuel_logs GROUP BY vehicle_id) f ON v.id=f.vehicle_id GROUP BY v.id`);
    data = rows; filename = 'fuel_efficiency';
  }
  if (!data.length) return res.json({ success: true, message: 'No data to export' });
  try {
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filename}_${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'CSV export failed' });
  }
});

module.exports = { getVehicleCosts, getFuelEfficiency, getFleetUtilization, getVehicleROI, exportCSV };
