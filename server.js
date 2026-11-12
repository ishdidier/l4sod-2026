require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Car Management API is running' });
});

// STAGE 1: READ CARS
app.get('/cars', (req, res) => {
  db.query('SELECT * FROM cars', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/cars/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM cars WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(results[0]);
  });
});

// STAGE 2: CREATE CAR
app.post('/cars', (req, res) => {
  const { brand_id, model, year, price, color, plate_number, status } = req.body;
  const currentYear = new Date().getFullYear();

  if (!brand_id || !model || !year || price === undefined || !plate_number) {
    return res.status(400).json({
      error: 'brand_id, model, year, price and plate_number are required'
    });
  }

  if (!Number.isInteger(Number(year)) || Number(year) < 1950 || Number(year) > currentYear + 1) {
    return res.status(400).json({ error: `year must be between 1950 and ${currentYear + 1}` });
  }
  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: 'price must be greater than 0' });
  }
  if (status && !['available', 'sold', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.query('SELECT id FROM brands WHERE id = ?', [brand_id], (err, brands) => {
    if (err) return res.status(500).json({ error: err.message });
    if (brands.length === 0) return res.status(400).json({ error: 'brand_id does not exist' });

    const sql = `INSERT INTO cars
      (brand_id, model, year, price, color, plate_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [
      brand_id, model, year, price, color || null, plate_number,
      status || 'available'
    ], (insertErr, result) => {
      if (insertErr) {
        if (insertErr.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'plate_number already exists' });
        }
        if (insertErr.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ error: 'brand_id does not exist' });
        }
        return res.status(500).json({ error: insertErr.message });
      }
      res.status(201).json({ message: 'Car created successfully', id: result.insertId });
    });
  });
});

// STAGE 2: READ BRANDS
app.get('/brands', (req, res) => {
  db.query('SELECT * FROM brands', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/brands/:id', (req, res) => {
  db.query('SELECT * FROM brands WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Brand not found' });
    res.json(results[0]);
  });
});

// STAGE 2: READ CUSTOMERS
app.get('/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/customers/:id', (req, res) => {
  db.query('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(results[0]);
  });
});

// STAGE 3: UPDATE CAR (replace editable fields)
app.put('/cars/:id', (req, res) => {
  const { brand_id, model, year, price, color, plate_number, status } = req.body;
  const id = req.params.id;
  const currentYear = new Date().getFullYear();

  if (!brand_id || !model || !year || price === undefined || !plate_number) {
    return res.status(400).json({
      error: 'brand_id, model, year, price and plate_number are required'
    });
  }
  if (!Number.isInteger(Number(year)) || Number(year) < 1950 || Number(year) > currentYear + 1) {
    return res.status(400).json({ error: `year must be between 1950 and ${currentYear + 1}` });
  }
  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: 'price must be greater than 0' });
  }
  if (status && !['available', 'sold', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.query('SELECT id FROM brands WHERE id = ?', [brand_id], (brandErr, brands) => {
    if (brandErr) return res.status(500).json({ error: brandErr.message });
    if (brands.length === 0) return res.status(400).json({ error: 'brand_id does not exist' });

    const sql = `UPDATE cars SET brand_id=?, model=?, year=?, price=?,
      color=?, plate_number=?, status=? WHERE id=?`;
    db.query(sql, [
      brand_id, model, year, price, color || null, plate_number,
      status || 'available', id
    ], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'plate_number belongs to another car' });
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Car not found' });
      res.json({ message: 'Car updated successfully' });
    });
  });
});

// STAGE 3: UPDATE ONLY CAR STATUS
app.patch('/cars/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['available', 'sold', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: 'status must be available, sold or maintenance' });
  }

  db.query('UPDATE cars SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Car not found' });
    res.json({ message: 'Car status updated successfully' });
  });
});

// STAGE 3: DELETE CAR
app.delete('/cars/:id', (req, res) => {
  db.query('SELECT id FROM sales WHERE car_id = ?', [req.params.id], (checkErr, sales) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (sales.length > 0) {
      return res.status(409).json({ error: 'Cannot delete a car that has already been sold' });
    }

    db.query('DELETE FROM cars WHERE id = ?', [req.params.id], (err, result) => {
      if (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(409).json({ error: 'Car is referenced by another record' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Car not found' });
      res.json({ message: 'Car deleted successfully' });
    });
  });
});

// ROADMAP STAGE 4: FULL CRUD FOR BRANDS
app.post('/brands', (req, res) => {
  const { name, country } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  db.query('INSERT INTO brands (name, country) VALUES (?, ?)', [name, country || null], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Brand name already exists' });
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Brand created successfully', id: result.insertId });
  });
});

app.put('/brands/:id', (req, res) => {
  const { name, country } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  db.query('UPDATE brands SET name=?, country=? WHERE id=?', [name, country || null, req.params.id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Brand name already exists' });
      return res.status(500).json({ error: err.message });
    }
    if (!result.affectedRows) return res.status(404).json({ error: 'Brand not found' });
    res.json({ message: 'Brand updated successfully' });
  });
});

app.delete('/brands/:id', (req, res) => {
  db.query('DELETE FROM brands WHERE id=?', [req.params.id], (err, result) => {
    if (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Cannot delete a brand that has cars' });
      return res.status(500).json({ error: err.message });
    }
    if (!result.affectedRows) return res.status(404).json({ error: 'Brand not found' });
    res.json({ message: 'Brand deleted successfully' });
  });
});

// ROADMAP STAGE 4: FULL CRUD FOR CUSTOMERS
app.post('/customers', (req, res) => {
  const { full_name, email, phone } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: 'full_name and email are required' });
  db.query('INSERT INTO customers (full_name, email, phone) VALUES (?, ?, ?)', [full_name, email, phone || null], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Customer email already exists' });
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Customer created successfully', id: result.insertId });
  });
});

app.put('/customers/:id', (req, res) => {
  const { full_name, email, phone } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: 'full_name and email are required' });
  db.query('UPDATE customers SET full_name=?, email=?, phone=? WHERE id=?', [full_name, email, phone || null, req.params.id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Customer email already exists' });
      return res.status(500).json({ error: err.message });
    }
    if (!result.affectedRows) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer updated successfully' });
  });
});

app.delete('/customers/:id', (req, res) => {
  db.query('DELETE FROM customers WHERE id=?', [req.params.id], (err, result) => {
    if (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Cannot delete a customer who has sales' });
      return res.status(500).json({ error: err.message });
    }
    if (!result.affectedRows) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  });
});

// DOCUMENT SECTION "STAGE 4": MAINTENANCE HISTORY
app.post('/cars/:id/maintenance', (req, res) => {
  const { description, cost, service_date } = req.body;
  if (!description || !service_date) {
    return res.status(400).json({ error: 'description and service_date are required' });
  }
  if (cost !== undefined && (!Number.isFinite(Number(cost)) || Number(cost) < 0)) {
    return res.status(400).json({ error: 'cost must be 0 or greater' });
  }

  db.query('SELECT id FROM cars WHERE id=?', [req.params.id], (checkErr, cars) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (!cars.length) return res.status(404).json({ error: 'Car not found' });

    db.query(
      'INSERT INTO maintenance (car_id, description, cost, service_date) VALUES (?, ?, ?, ?)',
      [req.params.id, description, cost === undefined ? 0 : cost, service_date],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Maintenance record created', id: result.insertId });
      }
    );
  });
});

app.get('/cars/:id/maintenance', (req, res) => {
  db.query('SELECT id FROM cars WHERE id=?', [req.params.id], (checkErr, cars) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (!cars.length) return res.status(404).json({ error: 'Car not found' });

    db.query(
      'SELECT * FROM maintenance WHERE car_id=? ORDER BY service_date DESC',
      [req.params.id],
      (err, records) => {
        if (err) return res.status(500).json({ error: err.message });
        const total_cost = records.reduce((sum, row) => sum + Number(row.cost), 0);
        res.json({ car_id: Number(req.params.id), total_cost, records });
      }
    );
  });
});

app.delete('/maintenance/:id', (req, res) => {
  db.query('DELETE FROM maintenance WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'Maintenance record not found' });
    res.json({ message: 'Maintenance record deleted successfully' });
  });
});

// 404 HANDLER MUST BE LAST
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
