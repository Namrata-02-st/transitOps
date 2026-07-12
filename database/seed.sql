USE transitops_db;

-- 1. Seed Roles
INSERT INTO roles (id, name) VALUES
(1, 'ADMIN'),
(2, 'FLEET_MANAGER'),
(3, 'DISPATCHER'),
(4, 'SAFETY_OFFICER'),
(5, 'FINANCIAL_ANALYST')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Seed Demo Users (Passwords are: role123, e.g., admin123, manager123)
-- Uses standard crypt hashes generated earlier
INSERT INTO users (id, name, email, password, role_id, status) VALUES
(1, 'John Admin', 'admin@transitops.com', '$2a$10$7OhT6l4QxDsN6l6U3KIc0OO81k1rTWYxIAJ33YOA/VT/mGCAO/iyG', 1, 'Active'),
(2, 'Sarah Manager', 'manager@transitops.com', '$2a$10$5va8flC1AVemfjUCefez3eKlCVPMxOV8UJfJ354o3Hk2FGO67/yZS', 2, 'Active'),
(3, 'Dave Dispatcher', 'dispatcher@transitops.com', '$2a$10$nZfvvs/QLl7sRexlhpP6O.SkrgGW7ew8Er7aw7vmj.Yhiea50KGYC', 3, 'Active'),
(4, 'Officer Safe', 'safety@transitops.com', '$2a$10$AinjCzlnot.xwzPlrBBtg.ziVVHxaKLNEZhoePvgenc1W/l7gEjHq', 4, 'Active'),
(5, 'Alice Analyst', 'analyst@transitops.com', '$2a$10$17vmHV1n/BFI.couKA9pPOo8/JY0G4SJRBuHSE5vlHu8TEBE2kRJG', 5, 'Active')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 3. Seed Sample Vehicles
INSERT INTO vehicles (id, registration_number, vehicle_name, model, vehicle_type, maximum_load_capacity, odometer, acquisition_cost, region, status) VALUES
(1, 'TX-9821-A', 'Heavy Carrier 01', 'Volvo FH16', 'Semi-Truck', 25000.00, 150000, 120000.00, 'South-West', 'Available'),
(2, 'CA-4432-B', 'Medium Box 02', 'Isuzu NPR', 'Box Truck', 8000.00, 85000, 45000.00, 'West-Coast', 'Available'),
(3, 'NY-1029-C', 'City Van 03', 'Ford Transit', 'Van', 3000.00, 42000, 32000.00, 'East-Coast', 'In Shop'),
(4, 'FL-8899-D', 'Flatbed Express', 'Peterbilt 389', 'Semi-Truck', 30000.00, 220000, 150000.00, 'South-East', 'On Trip'),
(5, 'IL-3321-E', 'Old Delivery', 'Chevrolet Express', 'Van', 25000.00, 310000, 28000.00, 'Mid-West', 'Retired')
ON DUPLICATE KEY UPDATE registration_number=VALUES(registration_number);

-- 4. Seed Sample Drivers
INSERT INTO drivers (id, name, email, license_number, license_category, license_expiry_date, contact_number, safety_score, region, status) VALUES
(1, 'Alex Driver', 'alex@transitops.com', 'DL-TEX-0019', 'Class A', '2027-05-15', '+1-555-0199', 95.50, 'South-West', 'Available'),
(2, 'Brian Carter', 'brian@transitops.com', 'DL-CAL-8821', 'Class B', '2026-08-10', '+1-555-0122', 88.00, 'West-Coast', 'Available'),
-- Expiring within 30 days relative to July 2026
(3, 'Charlie Miller', 'charlie@transitops.com', 'DL-NY-3321', 'Commercial', '2026-07-28', '+1-555-0144', 92.00, 'East-Coast', 'Off Duty'),
-- Expired license
(4, 'David Cross', 'david@transitops.com', 'DL-FL-4491', 'Class A', '2026-05-01', '+1-555-0177', 76.50, 'South-East', 'Suspended'),
(5, 'Edward Swift', 'edward@transitops.com', 'DL-IL-5521', 'Class B', '2028-11-20', '+1-555-0188', 99.00, 'Mid-West', 'On Trip')
ON DUPLICATE KEY UPDATE license_number=VALUES(license_number);

-- 5. Seed Sample Trip (linking vehicle 4 to driver 5)
INSERT INTO trips (id, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, starting_odometer, final_odometer, actual_distance, revenue, status, dispatch_date, completion_date, created_by) VALUES
(1, 'Warehouse A (Miami)', 'Distribution Center (Orlando)', 4, 5, 12000.00, 380.00, 219620, NULL, NULL, 1500.00, 'Dispatched', '2026-07-12 09:00:00', NULL, 1)
ON DUPLICATE KEY UPDATE id=VALUES(id);

-- 6. Seed Sample Maintenance Log (linking vehicle 3)
INSERT INTO maintenance_logs (id, vehicle_id, maintenance_type, description, priority, start_date, end_date, cost, status, created_by) VALUES
(1, 3, 'Tire Replacement', 'Replaced all 4 worn tires and did alignment check.', 'Medium', '2026-07-11', NULL, 850.00, 'Active', 1)
ON DUPLICATE KEY UPDATE id=VALUES(id);
