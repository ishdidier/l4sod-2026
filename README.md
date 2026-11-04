# Car Management System: Progressive Backend Project

**Stack:** Node.js, Express, MySQL (`mysql2`), dotenv  
**Style:** Single file (`server.js`), no MVC  
**Database connection:** `mysql.createConnection()`  
**Level:** Beginner to intermediate

---
# submission period from 4th November to 12 november
** Firstly fork this repo**
**clone repo under your names**
** create names.md files and includes names of members then push to your repo**
** create pull request not later than wednesday 11 november**
** happy coding, NDABAKUNDA **

## About This Project (Read First)

You will build the backend of a car dealership system: the hidden part of an app that stores the data and answers requests from a website or a phone app. By the end you will have a working API that a real dealership could connect a frontend to.

### The problem

Many small dealerships still track cars in notebooks or Excel. The same car gets entered twice, a sold car still shows as available, nobody knows which customer bought what, and service history is lost. Your system replaces that mess with one database and one API that enforces the rules.

### What a real dealership does, and what your API does for it

| Real-life task | What your API will do |
| --- | --- |
| New cars arrive from manufacturers | Store brands and cars (`POST /cars`, `/brands`) |
| A visitor asks: what do you have under 20,000? | Search and filter cars (`GET /cars?maxPrice=20000`) |
| A buyer is registered | Manage customers (`/customers`) |
| A car is sold and must no longer be for sale | Record the sale and mark the car `sold` together (`POST /sales`) |
| A car goes to the garage | Keep a service history per car (`/cars/:id/maintenance`) |
| The owner asks how business is going | Statistics and reports (`/stats`, `/reports/sales-by-brand`) |

### Why we build this project

- Almost every app you use (banks, shops, school systems) follows the same pattern: data in tables, rules in an API.
- You practise real skills: routes, SQL, relations between tables, validation, error codes and transactions.
- One file and no frameworks beyond Express keeps the focus on understanding, not on folder structure.
- You grow the system stage by stage, the way real teams grow a product.

### What you will have at the end

- A running REST API with more than 25 endpoints and 5 related tables, all in `server.js`.
- Secrets kept safe in `.env`, so you can publish the code on GitHub as part of your portfolio.
- The ability to explain, in your own words, how a request travels from Postman to the database and back.

### How we work

The teacher builds Stage 1 with you (only `GET /cars` and `GET /cars/:id`). After that, you write each new stage yourself from a short specification and hints. Do not start the next stage until your current stage passes its checkpoint. There is no frontend: you test everything with Postman, Thunder Client or curl.

---

## 1. Project Goal and Progressive Method

Students build a car dealership REST API over 7 stages on a 5-table database. The teacher delivers Stage 1 live (only `GET /cars` and `GET /cars/:id`); students write every later stage themselves from a specification and hints, not from finished code.

| Stage | Topic | Endpoints | task period |
| --- | --- | --- | --- |
| 0 | Setup: project, `.env`, `.gitignore`, database | none | your task |
| 1 | Read | `GET /cars`, `GET /cars/:id` | your task |
| 2 | Create, and repeat the read pattern | `POST /cars`, GET list and GET by id for brands and customers |your task|
| 3 | Update and delete cars | `PUT /cars/:id`, `PATCH /cars/:id/status`, `DELETE /cars/:id` | future work |
| 4 | Full CRUD on supporting tables | POST, PUT, DELETE for brands and customers | future work |
| 5 | Sales with a transaction | `POST /sales`, `GET /sales`, `GET /sales/:id` | future work|
| 6 | Maintenance history | `POST` and `GET /cars/:id/maintenance` | your task |
| 7 | Search and reports | filters, `/stats`, `/reports/...` | future work |

**Rule for every stage:** students must pass the stage checkpoint before moving on. There is no frontend: test with Postman, Thunder Client, or curl.

## 2. Learning Objectives

- Set up a Node.js project and protect secrets with `.env` and `.gitignore`.
- Connect to MySQL with `mysql.createConnection()`.
- Build GET, POST, PUT, PATCH and DELETE routes in one `server.js` file.
- Design relations with primary keys, foreign keys and JOIN queries.
- Validate input and return correct status codes (200, 201, 400, 404, 409, 500).
- Prevent SQL injection with `?` placeholders.
- Keep two tables consistent with a transaction (`beginTransaction`, `commit`, `rollback`).
- Write summary queries with `COUNT`, `SUM`, `AVG` and `GROUP BY`.

## 3. Database Design (5 Tables)

The database models a real dealership: cars belong to brands, customers buy cars through sales, and each car keeps a maintenance history.

| Table | Purpose | Key columns | Relations |
| --- | --- | --- | --- |
| `brands` | Car manufacturers | id, name (unique), country | One brand has many cars |
| `cars` | Inventory | id, brand_id, model, year, price, color, plate_number (unique), status | Belongs to one brand |
| `customers` | Buyers | id, full_name, email (unique), phone | One customer has many sales |
| `sales` | Completed purchases | id, car_id, customer_id, sale_price, sale_date | Links one car to one customer |
| `maintenance` | Service history | id, car_id, description, cost, service_date | Belongs to one car |

`cars.status` is one of `available`, `sold`, `maintenance`.

## 4. Stage 0 – Setup (Teacher and Students Together)

### Create the project

```bash
mkdir car-management
cd car-management
npm init -y
npm install express mysql2 dotenv
npm install --save-dev nodemon
```

Add these scripts to `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Final folder structure (no MVC, one code file):

```
car-management/
├── node_modules/      (ignored by git)
├── .env               (ignored by git)
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

### Environment files

`.env` (real values, never committed):

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=car_management
```

`.env.example` (committed, no secrets):

```
PORT=3000
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=car_management
```

`.gitignore`:

```
node_modules/
.env
```

**Discussion question:** Why must `.env` never be pushed to GitHub?

### Create the database

Run this script in MySQL Workbench, phpMyAdmin, or the MySQL terminal:

```sql
CREATE DATABASE IF NOT EXISTS car_management;
USE car_management;

CREATE TABLE brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  country VARCHAR(50)
);

CREATE TABLE cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  color VARCHAR(30),
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('available','sold','maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT NOT NULL,
  customer_id INT NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL,
  FOREIGN KEY (car_id) REFERENCES cars(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_date DATE NOT NULL,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

INSERT INTO brands (name, country) VALUES
('Toyota', 'Japan'),
('Honda', 'Japan'),
('Ford', 'USA');

INSERT INTO cars (brand_id, model, year, price, color, plate_number, status) VALUES
(1, 'Corolla', 2020, 15000.00, 'White', 'RAB123A', 'available'),
(2, 'Civic', 2019, 14000.00, 'Black', 'RAC456B', 'available'),
(3, 'Focus', 2018, 11000.00, 'Blue', 'RAD789C', 'maintenance'),
(1, 'RAV4', 2021, 24000.00, 'Grey', 'RAE321D', 'sold');

INSERT INTO customers (full_name, email, phone) VALUES
('Alice Uwase', 'alice@example.com', '0788000001'),
('Eric Mugisha', 'eric@example.com', '0788000002');

INSERT INTO sales (car_id, customer_id, sale_price, sale_date) VALUES
(4, 1, 23500.00, '2026-10-15');

INSERT INTO maintenance (car_id, description, cost, service_date) VALUES
(3, 'Brake pads replacement', 120.00, '2026-10-20'),
(2, 'Oil change', 45.00, '2026-09-30');
```

**Checkpoint:** `SELECT * FROM cars;` returns 4 rows, and `.env` does not appear in `git status`.

## 5. Stage 1 – Read (Teacher Demo)

This is the only code the teacher provides: the server, the `createConnection` setup, and two GET routes. Students type it along, then extend the same file in every later stage. New routes always go above the 404 handler.

```js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Database connection (createConnection is required in this project)
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

// GET /cars - list all cars
app.get('/cars', (req, res) => {
  db.query('SELECT * FROM cars', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET /cars/:id - get one car
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

// ---- NEW ROUTES GO HERE (above the 404 handler) ----

// 404 handler: must stay last
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Checkpoint:**

- `GET http://localhost:3000/cars` returns the 4 cars.
- `GET http://localhost:3000/cars/1` returns the Corolla.
- `GET http://localhost:3000/cars/999` returns 404 with `Car not found`.

**Teaching points:**

- The `?` placeholder protects against SQL injection. Show what could go wrong with `'... WHERE id = ' + id`.
- `SELECT *` returns every column, including `brand_id`; students will meet `JOIN` later to show the brand name.
- `return` before `res.status(...)` stops the function so only one response is sent.

## 6. Your tasks (stage 2 up to 4) others will follow

Each stage gives a goal, rules, hints and a checkpoint. Students write the code; the teacher reviews it against the checkpoint before the next stage starts.

### Stage 2 – Create and repeat the read pattern

**Goal:** add cars through the API, and read the two supporting tables.

**Tasks**

1. `POST /cars` with body `brand_id`, `model`, `year`, `price`, `color`, `plate_number`, optional `status`.
2. `GET /brands` and `GET /brands/:id`.
3. `GET /customers` and `GET /customers/:id`.

**Rules for `POST /cars`**

- Missing `brand_id`, `model`, `year`, `price` or `plate_number` returns 400.
- `year` outside 1950 to next year returns 400. `price` of 0 or less returns 400.
- Unknown `brand_id` returns 400 with a clear message.
- Duplicate `plate_number` returns 409.
- Success returns 201 with the new car's `id`.

**Hints**

- Copy the pattern from Stage 1 for the four GET routes; only the table changes.
- `result.insertId` gives the new row's id.
- MySQL error codes: `ER_DUP_ENTRY` (duplicate unique value) and `ER_NO_REFERENCED_ROW_2` (foreign key does not exist).

**Checkpoint:** a new car appears in `GET /cars`; a duplicate plate returns 409; `GET /brands/99` returns 404.

### Stage 3 – Update and delete cars

**Goal:** change and remove cars safely.

**Tasks**

1. `PUT /cars/:id` replaces all editable fields of a car.
2. `PATCH /cars/:id/status` changes only the status.
3. `DELETE /cars/:id`.

**Rules**

- Reuse the validation from `POST /cars`.
- `PATCH` accepts only `available`, `sold` or `maintenance`; anything else returns 400.
- Any of the three on a car that does not exist returns 404.
- `PUT` with a plate number owned by another car returns 409.
- `DELETE` on a car that already has a sale returns 409 with a clear message.

**Hints**

- `result.affectedRows === 0` means no row matched the id.
- Deleting a referenced row raises `ER_ROW_IS_REFERENCED_2`.
- Test `PUT` with the same plate on the same car: it must still work.

**Checkpoint:** update a car and see the change in `GET /cars/:id`; `DELETE /cars/4` returns 409 because the car was sold.

 

 

### Stage 4 – Maintenance history

**Goal:** track services done on each car.

**Tasks**

1. `POST /cars/:id/maintenance` with body `description`, `cost`, `service_date`.
2. `GET /cars/:id/maintenance` lists the car's records, newest first, plus the total cost.
3. `DELETE /maintenance/:id`.

**Rules**

- Unknown car returns 404.
- `description` and `service_date` are required; `cost` must be 0 or more (400 otherwise).
- Deleting a car must also remove its maintenance records (the table already uses `ON DELETE CASCADE`).

**Hint:** return `{ car_id, total_cost, records: [...] }` using `SUM(cost)` or a loop over the results.

**Checkpoint:** `GET /cars/3/maintenance` shows the brake pads record with total cost 120.


## 7. Full API Roadmap (only GET, GET by ID, POST others will follow ) 

| Method | Endpoint | Stage | Success code |
| --- | --- | --- | --- |
| GET | `/cars` | 1 (filters in 7) | 200 |
| GET | `/cars/:id` | 1 | 200 |
| POST | `/cars` | 2 | 201 |
| GET | `/brands`, `/brands/:id`, `/customers`, `/customers/:id` | 2 | 200 |
| PUT | `/cars/:id` | 3 | 200 |
| PATCH | `/cars/:id/status` | 3 | 200 |
| DELETE | `/cars/:id` | 3 | 200 |
| POST, PUT, DELETE | `/brands`, `/brands/:id` | 4 | 201, 200, 200 |
| POST, PUT, DELETE | `/customers`, `/customers/:id` | 4 | 201, 200, 200 |
| POST | `/sales` | 5 | 201 |
| GET | `/sales`, `/sales/:id` | 5 | 200 |
| POST | `/cars/:id/maintenance` | 6 | 201 |
| GET | `/cars/:id/maintenance` | 6 | 200 |
| DELETE | `/maintenance/:id` | 6 | 200 |
| GET | `/stats` | 7 | 200 |
| GET | `/reports/sales-by-brand` | 7 | 200 |
| GET | `/customers/:id/purchases` | 7 | 200 |

## 8. Sample Test Requests

**POST /cars**

```json
{
  "brand_id": 1,
  "model": "Yaris",
  "year": 2022,
  "price": 17000,
  "color": "Red",
  "plate_number": "RAF555E"
}
```

**POST /sales**

```json
{ "car_id": 1, "customer_id": 2, "sale_price": 14800 }
```

**curl example**

```bash
curl -X PATCH http://localhost:3000/cars/2/status \
  -H "Content-Type: application/json" \
  -d '{"status":"maintenance"}'
```

## 9.  Progressive Stages Checklist for Students

- [ ] Stage 0: server connects to MySQL; `.env` is not in `git status`.
- [ ] Stage 1: `GET /cars` and `GET /cars/:id` work; unknown id returns 404.
- [ ] Stage 2: `POST /cars` returns 400, 409 and 201 in the right cases.
- [ ] Stage 3: `PUT`, `PATCH` and `DELETE` work; deleting a sold car returns 409.
- [ ] Stage 4: brands and customers have full CRUD with unique checks.
- [ ] Stage 5: a failed sale never leaves a car marked `sold`.
- [ ] Stage 6: maintenance records are listed with a correct total.
- [ ] Stage 7: filters combine; `/stats` and the brand report match the data.

 
