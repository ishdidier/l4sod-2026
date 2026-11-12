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