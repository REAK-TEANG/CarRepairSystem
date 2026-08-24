import { pool, query } from './db.js';

async function seedData() {
  console.log('🌱 Starting database seeding with realistic data...');

  try {
    // 1. Roles
    const roles = [
      ['Admin', 'Full system access and configuration'],
      ['Manager', 'Manage operations, employees, and reports'],
      ['Service Advisor', 'Handle customers, appointments, and repair orders'],
      ['Mechanic', 'View and update assigned repair jobs'],
      ['Cashier', 'Manage invoices and payments'],
      ['Storekeeper', 'Manage spare parts inventory and suppliers']
    ];
    for (const [name, desc] of roles) {
      await query.run(
        `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [name, desc]
      );
    }
    console.log('✅ Roles seeded');

    // 2. Users & Employees (Mechanics, Service Advisors, Managers)
    const employeesData = [
      { code: 'EMP-001', name: 'Jordan Hayes', email: 'jordan.h@workshop.com', phone: '(555) 111-2233', role: 'Mechanic', spec: 'Engine & Transmission', exp: 8, salary: 4500 },
      { code: 'EMP-002', name: 'Elena Rostova', email: 'elena.r@workshop.com', phone: '(555) 222-3344', role: 'Mechanic', spec: 'Electrical & Diagnostics', exp: 6, salary: 4400 },
      { code: 'EMP-003', name: 'Carlos Mendez', email: 'carlos.m@workshop.com', phone: '(555) 333-4455', role: 'Mechanic', spec: 'Brakes & Suspension', exp: 10, salary: 4800 },
      { code: 'EMP-004', name: 'Liam Vance', email: 'liam.v@workshop.com', phone: '(555) 444-5566', role: 'Mechanic', spec: 'General Maintenance & Fluids', exp: 4, salary: 3600 },
      { code: 'EMP-005', name: 'Daniel Craig', email: 'daniel.c@workshop.com', phone: '(555) 019-2001', role: 'Manager', spec: 'Workshop Operations', exp: 12, salary: 5800 },
      { code: 'EMP-006', name: 'Kate Morrison', email: 'kate.m@workshop.com', phone: '(555) 019-2002', role: 'Service Advisor', spec: 'Customer Relations', exp: 5, salary: 4200 },
    ];

    for (const emp of employeesData) {
      const username = emp.name.toLowerCase().replace(/\s+/g, '_');
      const user = await query.get(
        `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
         VALUES ($1, $2, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', $3, $4, 4)
         ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [username, emp.email, emp.name, emp.phone]
      );

      await query.run(
        `INSERT INTO employees (user_id, employee_code, position, specialization, experience_years, salary, employment_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Active')
         ON CONFLICT (employee_code) DO UPDATE SET specialization = EXCLUDED.specialization, salary = EXCLUDED.salary`,
        [user.id, emp.code, emp.role, emp.spec, emp.exp, emp.salary]
      );
    }
    console.log('✅ Employees & Mechanics seeded');

    // 3. Customers
    const customers = [
      ['CUST-001', 'Alex Morgan', '(555) 234-5678', 'alex.m@example.com', '124 Maple Dr, Tech City', 'VIP customer, prefers OEM parts only.'],
      ['CUST-002', 'Sarah Jenkins', '(555) 876-5432', 'sarah.j@example.com', '789 Oak Ave, Springfield', 'Corporate fleet manager.'],
      ['CUST-003', 'David Chen', '(555) 345-6789', 'd.chen@example.com', '45 Pine St, Metropolis', 'Regular maintenance contract.'],
      ['CUST-004', 'Emily Watson', '(555) 987-6543', 'emily.w@example.com', '321 Elm Blvd, Riverdale', 'Referred by David Chen.'],
      ['CUST-005', 'Marcus Vance', '(555) 456-7890', 'm.vance@example.com', '56 Cedar Ln, Gotham', 'Track day enthusiast.'],
      ['CUST-006', 'Jessica Alba', '(555) 654-3210', 'jessica.a@example.com', '88 Sunset Blvd, Los Angeles', 'Executive vehicle servicing.'],
      ['CUST-007', 'Michael Torres', '(555) 789-0123', 'm.torres@example.com', '99 Industrial Pkwy, Chicago', 'Commercial delivery van owner.'],
    ];

    for (const [code, name, phone, email, address, notes] of customers) {
      await query.run(
        `INSERT INTO customers (customer_code, full_name, phone, email, address, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (customer_code) DO NOTHING`,
        [code, name, phone, email, address, notes]
      );
    }
    console.log('✅ Customers seeded');

    const customerRows = await query.all('SELECT id, customer_code FROM customers ORDER BY id ASC');
    const custMap = {};
    customerRows.forEach(c => { custMap[c.customer_code] = c.id; });
    const fallbackCustId = customerRows[0]?.id || 1;

    // 4. Vehicles
    const vehicles = [
      ['CUST-001', 'ABC-1234', '1HGCR2F83HA001234', 'Toyota', 'Camry', 2022, 'Midnight Blue', 'Gasoline', 34500, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80', 'Regular 5k mile service schedule.'],
      ['CUST-002', 'XYZ-5678', 'WBA3A5C58DF105678', 'BMW', '330i', 2021, 'Alpine White', 'Gasoline', 28000, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=80', 'Requires synthetic 0W-20 oil.'],
      ['CUST-003', 'DEF-9012', '1FADP5CU8GA009012', 'Ford', 'F-150', 2020, 'Shadow Black', 'Gasoline', 62000, 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&auto=format&fit=crop&q=80', 'Heavy duty towing package.'],
      ['CUST-004', 'GHI-3456', 'JH4CU2F68CC003456', 'Honda', 'Civic', 2023, 'Sonic Gray', 'Gasoline', 15200, 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&auto=format&fit=crop&q=80', 'New tires installed last month.'],
      ['CUST-005', 'JKL-7890', 'WAUZZZF27HA007890', 'Audi', 'A4', 2022, 'Ibis White', 'Gasoline', 24100, 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80', 'Extended warranty active.'],
      ['CUST-006', 'MNO-4321', '5N1AL0MM8EC123456', 'Tesla', 'Model 3', 2023, 'Pearl White', 'Electric', 18500, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&auto=format&fit=crop&q=80', 'Annual battery & brake fluid check.'],
      ['CUST-007', 'PQR-8765', '2HKRM4H78MH654321', 'Mercedes-Benz', 'C300', 2021, 'Obsidian Black', 'Gasoline', 41200, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&auto=format&fit=crop&q=80', 'Scheduled for transmission service.']
    ];

    for (const [custCode, plate, vin, brand, model, year, color, fuel, miles, photo, notes] of vehicles) {
      const cId = custMap[custCode] || fallbackCustId;
      await query.run(
        `INSERT INTO vehicles (customer_id, vehicle_number, vin, brand, model, year, color, fuel_type, mileage, photo_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [cId, plate, vin, brand, model, year, color, fuel, miles, photo, notes]
      );
    }
    console.log('✅ Vehicles seeded');

    // 5. Services Catalog
    const services = [
      ['Full Synthetic Oil & Filter Service', 'Drain and refill with premium synthetic motor oil, replace OEM filter with multi-point inspection.', 89.99, 1.0],
      ['Front & Rear Brake Pad Replacement', 'Install premium ceramic brake pads and inspect brake calipers, rotors, and brake fluid lines.', 249.99, 2.5],
      ['Comprehensive Multi-Point Inspection', 'Complete computerized diagnostics on engine, transmission, suspension, battery, and safety systems.', 59.99, 1.0],
      ['Wheel Alignment & High-Speed Balancing', 'Computerized 4-wheel laser alignment and high-speed tire balancing for smooth highway ride.', 119.99, 1.5],
      ['Automatic Transmission Fluid Flush & Service', 'Complete transmission fluid evacuation, pan cleaning, filter replacement, and fluid refill.', 289.99, 2.0],
      ['Air Conditioning System Recharge & Leak Test', 'Refrigerant recovery, vacuum leak test, and R134a/R1234yf recharge with UV dye inspection.', 169.99, 1.5],
      ['Spark Plugs & Ignition Coil Replacement', 'Install laser iridium spark plugs and test ignition coil pack resistance across all cylinders.', 199.99, 2.0],
      ['Engine Cooling System Flush & Thermostat', 'Radiator flush, coolant renewal with OEM 50/50 mix, and thermostat seal inspection.', 149.99, 1.5]
    ];

    for (const [name, desc, cost, hours] of services) {
      await query.run(
        `INSERT INTO services (name, description, estimated_cost, estimated_hours)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [name, desc, cost, hours]
      );
    }
    console.log('✅ Services catalog seeded');

    // 6. Suppliers
    const suppliers = [
      ['Brembo OEM Distribution', 'Marco Rossi', '(555) 999-0011', 'orders@brembo-supply.com', '88 Performance Way, Los Angeles, CA'],
      ['Global Lubricants Corp', 'Tom Hardy', '(555) 888-9900', 'sales@globallube.com', '45 Refinery Way, Houston, TX'],
      ['AutoParts Direct Wholesale', 'Rachel Green', '(555) 777-8899', 'orders@autopartsdirect.com', '100 Industrial Blvd, Detroit, MI'],
      ['Bosch Automotive Aftermarket', 'Hans Gruber', '(555) 333-2211', 'dealer-support@bosch-auto.com', '200 Technology Dr, Chicago, IL'],
      ['Denso Electronics Supply', 'Kenji Sato', '(555) 444-6677', 'supply@denso-usa.com', '12 Silicon Blvd, San Jose, CA']
    ];

    for (const [name, contact, phone, email, address] of suppliers) {
      await query.run(
        `INSERT INTO suppliers (name, contact_name, phone, email, address)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [name, contact, phone, email, address]
      );
    }
    console.log('✅ Suppliers seeded');

    const supplierRows = await query.all('SELECT id FROM suppliers ORDER BY id ASC');
    const sId = supplierRows[0]?.id || 1;

    // 7. Spare Parts
    const parts = [
      ['BP-7821', 'Ceramic Front Brake Pads', 'Brakes', 'Brembo', 64.99, 24, 8, sId, 'Shelf A-01'],
      ['BR-3321', 'Vented Brake Rotors (Pair)', 'Brakes', 'Brembo', 145.00, 12, 6, sId, 'Shelf A-04'],
      ['OF-1044', 'Synthetic Oil Filter Cartridge', 'Filters', 'Mobil 1', 12.50, 48, 15, sId, 'Shelf B-03'],
      ['AF-2088', 'High-Flow Engine Air Filter', 'Filters', 'Bosch', 24.99, 30, 10, sId, 'Shelf B-05'],
      ['SP-9920', 'Iridium Spark Plug Set (x4)', 'Ignition', 'NGK', 45.00, 18, 10, sId, 'Shelf C-02'],
      ['FL-5020', 'Full Synthetic 5W-30 (5 Quart)', 'Fluids', 'Mobil 1', 38.99, 35, 12, sId, 'Rack D-01'],
      ['FL-7590', 'Synthetic Gear Oil 75W-90 (1 Qt)', 'Fluids', 'Valvoline', 18.50, 20, 8, sId, 'Rack D-03'],
      ['BT-1200', 'AGM 12V 850CCA Auto Battery', 'Electrical', 'Bosch', 189.99, 8, 4, sId, 'Rack E-02'],
      ['WP-4010', 'Heavy Duty Serpentine Belt', 'Belts', 'Continental', 32.50, 15, 5, sId, 'Shelf C-04'],
      ['AC-134A', 'R-134a Refrigerant Can (12 oz)', 'AC', 'DuPont', 14.99, 40, 15, sId, 'Rack F-01']
    ];

    for (const [code, name, cat, brand, price, qty, min, supId, loc] of parts) {
      await query.run(
        `INSERT INTO spare_parts (part_code, name, category, brand, unit_price, stock_quantity, min_stock, supplier_id, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (part_code) DO NOTHING`,
        [code, name, cat, brand, price, qty, min, supId, loc]
      );
    }
    console.log('✅ Spare parts inventory seeded');

    // Get live IDs
    const vehicleRows = await query.all('SELECT id, customer_id FROM vehicles ORDER BY id ASC');
    const empRows = await query.all('SELECT id FROM employees ORDER BY id ASC');

    const v1 = vehicleRows[0]?.id || 1;
    const v2 = vehicleRows[1]?.id || v1;
    const v3 = vehicleRows[2]?.id || v1;
    const v4 = vehicleRows[3]?.id || v1;
    const v5 = vehicleRows[4]?.id || v1;

    const c1 = vehicleRows[0]?.customer_id || fallbackCustId;
    const c2 = vehicleRows[1]?.customer_id || fallbackCustId;
    const c3 = vehicleRows[2]?.customer_id || fallbackCustId;
    const c4 = vehicleRows[3]?.customer_id || fallbackCustId;
    const c5 = vehicleRows[4]?.customer_id || fallbackCustId;

    const m1 = empRows[0]?.id || 1;
    const m2 = empRows[1]?.id || m1;
    const m3 = empRows[2]?.id || m1;
    const m4 = empRows[3]?.id || m1;

    // 8. Appointments
    const appointments = [
      ['APT-2026-001', c1, v1, m1, '2026-08-24', '09:00', 'Confirmed', 'Customer requested multi-point safety inspection before road trip.'],
      ['APT-2026-002', c2, v2, m3, '2026-08-24', '11:00', 'Scheduled', 'Squeaking noise when applying brakes at low speeds.'],
      ['APT-2026-003', c3, v3, m2, '2026-08-25', '14:00', 'Scheduled', 'AC blowing lukewarm air during hot afternoons.'],
      ['APT-2026-004', c4, v4, m4, '2026-08-26', '10:30', 'Confirmed', 'Vehicle pulling to the right side on the highway.'],
      ['APT-2026-005', c5, v5, m1, '2026-08-27', '08:30', 'Scheduled', 'Check engine light illuminated (P0420 catalytic efficiency).']
    ];

    for (const [code, custId, vehId, mechId, date, time, status, notes] of appointments) {
      await query.run(
        `INSERT INTO appointments (appointment_code, customer_id, vehicle_id, mechanic_id, scheduled_date, scheduled_time, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (appointment_code) DO NOTHING`,
        [code, custId, vehId, mechId, date, time, status, notes]
      );
    }
    console.log('✅ Appointments seeded');

    const aptRows = await query.all('SELECT id FROM appointments ORDER BY id ASC');
    const a1 = aptRows[0]?.id || null;
    const a2 = aptRows[1]?.id || null;
    const a3 = aptRows[2]?.id || null;
    const a4 = aptRows[3]?.id || null;

    // 9. Repair Orders
    const repairOrders = [
      ['RO-2026-0041', a1, c1, v1, m1, 'Engine knocking noise at idle', 'Worn serpentine belt tensioner pulley and cylinder 2 misfire.', 420.00, 420.00, 'Repairing', 'Parts pulled from Shelf C-04.'],
      ['RO-2026-0042', a2, c2, v2, m3, 'Brake squeal and steering shudder during deceleration', 'Front rotors warped beyond spec (0.015 runout), pads at 2mm.', 380.00, 0.00, 'Waiting for Parts', 'Waiting on Brembo OEM rotors delivery.'],
      ['RO-2026-0043', a3, c3, v3, m2, 'Transmission slips between 2nd and 3rd gear', 'Low fluid level and sticking shift solenoid valve circuit B.', 650.00, 0.00, 'Diagnosing', 'Transmission pan inspection in progress.'],
      ['RO-2026-0044', a4, c4, v4, m4, 'Check engine light code P0420', 'Downstream heated O2 sensor faulty, catalytic converter healthy.', 220.00, 220.00, 'Completed', 'Tested and verified cleared fault codes. Ready for pickup.']
    ];

    for (const [orderNum, aptId, custId, vehId, mechId, prob, diag, estCost, actCost, status, notes] of repairOrders) {
      await query.run(
        `INSERT INTO repair_orders (order_number, appointment_id, customer_id, vehicle_id, mechanic_id, problem_description, diagnosis, estimated_cost, actual_cost, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (order_number) DO NOTHING`,
        [orderNum, aptId, custId, vehId, mechId, prob, diag, estCost, actCost, status, notes]
      );
    }
    console.log('✅ Repair orders seeded');

    const roRows = await query.all('SELECT id, customer_id FROM repair_orders ORDER BY id ASC');

    // 10. Invoices
    if (roRows.length >= 4) {
      const invoices = [
        ['INV-2026-001', roRows[0].id, roRows[0].customer_id, 420.00, 420.00, 0.00, 'Paid', '2026-08-20', '2026-08-27'],
        ['INV-2026-002', roRows[1].id, roRows[1].customer_id, 380.00, 0.00, 380.00, 'Issued', '2026-08-22', '2026-08-29'],
        ['INV-2026-003', roRows[2].id, roRows[2].customer_id, 650.00, 300.00, 350.00, 'Partially Paid', '2026-08-21', '2026-08-28'],
        ['INV-2026-004', roRows[3].id, roRows[3].customer_id, 220.00, 220.00, 0.00, 'Paid', '2026-08-19', '2026-08-26']
      ];

      for (const [invNum, roId, custId, total, paid, bal, status, issue, due] of invoices) {
        await query.run(
          `INSERT INTO invoices (invoice_number, repair_order_id, customer_id, total_amount, amount_paid, balance_due, status, issued_date, due_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (invoice_number) DO NOTHING`,
          [invNum, roId, custId, total, paid, bal, status, issue, due]
        );
      }
      console.log('✅ Invoices seeded');
    }

    console.log('\n🎉 ALL TABLES POPULATED WITH SAMPLE DATA SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
