# 📊Golden - Business Management System

A comprehensive Full-Stack Business Management application designed to streamline daily retail and wholesale operations. Built with a robust **Spring Boot** backend, **MongoDB Cloud (Atlas)** database, and an intuitive responsive frontend.

---

## 🚀 Key Features

* **Dashboard & Analytics:** Real-time summary of sales, stock levels, orders, and revenue.
* **Product & Inventory Management:** Add, track, update, and manage products and stock thresholds.
* **Order Management:** Create and track customer orders, payment statuses, and invoice generation.
* **Customer Management:** Maintain customer records, purchase histories, and contact info.
* **Role-Based Security:** JWT authentication with protected endpoints and automated data seeding.

---

## 🛠️ Tech Stack

* **Backend:** Java 21, Spring Boot 3.x, Spring Data MongoDB, Spring Security (JWT)
* **Database:** MongoDB Atlas (Cloud Database)
* **Frontend:** HTML5, CSS3, JavaScript (Fetch API)
* **Build Tool:** Apache Maven

---

## ⚙️ Prerequisites & Setup

### 1. Prerequisites
* **Java Development Kit (JDK 21+)**
* **Maven**
* **MongoDB Atlas Account**

### 2. Backend Configuration
Navigate to `src/main/resources/application.properties` and configure your MongoDB Atlas URI:

```properties
spring.application.name=small-business-management
server.port=8081

# MongoDB Configuration
spring.data.mongodb.uri=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_URL>/<DB_NAME>?retryWrites=true&w=majority

# JWT Configuration
app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.expiration=86400000

# CORS Allowed Origins
app.cors.allowed-origins=http://localhost:5500,[http://127.0.0.1:5500](http://127.0.0.1:5500),http://localhost:63342,null
