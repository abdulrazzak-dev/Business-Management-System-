# 📊 Golden - Small Business Management System

A comprehensive Full-Stack Business Management application designed to streamline daily retail and wholesale operations. Built with a robust **Spring Boot** backend, **MongoDB Cloud (Atlas)** database, and an intuitive responsive frontend deployed on **Vercel**.

---

## 🌐 Live Demo

* **Live Application:** [https://business-management-system-plum.vercel.app/](https://business-management-system-plum.vercel.app/)

---

## 🚀 Key Features

* **Dashboard & Analytics:** Real-time summary of sales, stock levels, orders, and revenue.
* **Product & Inventory Management:** Add, track, update, and manage products with low-stock alerts.
* **Order Management:** Create and track customer orders, payment statuses, and invoice processing.
* **Customer Management:** Maintain comprehensive customer directories and purchase histories.
* **Secure Authentication:** JWT token-based authentication with protected REST API endpoints.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Modern JavaScript (Fetch API), Deployed on **Vercel**
* **Backend:** Java 21, Spring Boot 3.x, Spring Data MongoDB, Spring Security (JWT)
* **Database:** MongoDB Atlas (Cloud Database)
* **Build Tool:** Apache Maven

---

## 🔐 Demo Credentials

Use the default administrator credentials to explore the system:

* **Email:** `admin@bizpulse.com`
* **Password:** `admin123`

---

## ⚙️ Local Development Setup

### 1. Prerequisites
* **Java Development Kit (JDK 21+)**
* **Maven**
* **MongoDB Atlas Account**

### 2. Backend Configuration
Configure your database connection in `small-business-management-backend/src/main/resources/application.properties`:

```properties
spring.application.name=small-business-management
server.port=8081

# MongoDB Atlas Configuration
spring.data.mongodb.uri=mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.lcxflzy.mongodb.net/business_db?retryWrites=true&w=majority

# JWT Configuration
app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration=86400000

# CORS Configuration (Include your Vercel URL and local origins)
app.cors.allowed-origins=http://localhost:5500,[http://127.0.0.1:5500](http://127.0.0.1:5500),http://localhost:63342,[https://business-management-system-plum.vercel.app](https://business-management-system-plum.vercel.app)
