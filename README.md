# 🚀 BLAST (Blockchain Ledger & Secure Transactions)

BLAST is a full-stack backend system designed to manage secure financial transactions with authentication and role-based access control. It is built using Spring Boot and is structured to support future blockchain integration for immutable transaction verification.

---

## 🧠 Project Objective

To design and implement a secure transaction management system that:

- Stores transaction data reliably
- Prevents unauthorized access
- Supports user authentication and roles
- Prepares for blockchain-based immutability

---

## 🏗 System Architecture

```
               Client (Postman / Frontend)
                           ↓
                 Spring Boot REST API
                           ↓
           Service Layer (Business Logic)
                           ↓
                 Repository Layer (JPA)
                           ↓
                    MySQL Database
                           ↓
                Blockchain Layer (Future Scope)
```

## ⚙️ Tech Stack

### Backend
- Java 17+
- Spring Boot
- Spring Security
- Spring Data JPA (Hibernate)

### Authentication
- JWT (JSON Web Token)
- BCrypt Password Hashing

### Database
- MySQL

### Build Tool
- Maven

---

## 🔐 Features

### ✅ Authentication
- User Registration
- User Login
- Password Encryption (BCrypt)
- JWT Token Generation

### ✅ Authorization
- Role-based system (USER / ADMIN)
- Protected API endpoints

### ✅ Transaction Management
- Create transactions
- Fetch all transactions
- Store transaction records in MySQL

### ✅ Security
- JWT-based request validation
- Stateless authentication
- Centralized exception handling

---

## 📂 Project Structure

```

com.example.blast
│
├── controller/        → REST APIs
├── service/           → Business logic
├── repository/        → Database access (JPA)
├── model/             → Entity classes
├── dto/               → Request/response objects
├── config/            → Security configuration
├── security/          → JWT logic
├── exception/         → Global error handling
└── BlastApplication.java

````

---

## ▶️ Running the Project

### Using Maven Wrapper

Windows:

```
.\mvnw spring-boot:run
```

Mac/Linux:

```
./mvnw spring-boot:run
```

Server starts at:

```
http://localhost:8081
```

---

## 🔎 API Endpoints

---

### 🔐 Authentication APIs

#### Register

```
POST /api/auth/register
```

Body:

```json
{
  "username": "john",
  "password": "1234",
  "role": "USER"
}
```

---

#### Login

```
POST /api/auth/login
```

Response:

```json
{
  "token": "JWT_TOKEN"
}
```

---

### 📊 Transaction APIs (Protected)

⚠ Requires JWT Token

#### Get All Transactions

```
GET /api/transactions
```

#### Create Transaction

```
POST /api/transactions
```

---

## 🔑 How to Use JWT in Postman

1. Login and copy token
2. Go to Authorization tab
3. Select **Bearer Token**
4. Paste token

OR manually:

```
Authorization: Bearer YOUR_TOKEN
```

---

## 🛡 Security Flow

1. User logs in → receives JWT
2. Client sends JWT in header
3. Backend validates token
4. Access granted if valid

---

## 📌 Business Rules

* Transaction ID must be unique
* Amount must be positive
* Timestamp is auto-generated
* Duplicate transactions are not allowed
* Only authenticated users can access APIs

---

## 🔮 Future Enhancements

* Smart contracts
* Multi-bank system
* Docker deployment
