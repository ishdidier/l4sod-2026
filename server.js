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


// 404 HANDLER MUST BE LAST
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});