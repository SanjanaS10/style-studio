# Style Studio

A full-stack fashion e-commerce platform featuring secure authentication, integrated payments, Redis-backed caching, and an interactive 3D virtual try-on experience — built with the MERN stack and containerized with Docker.

## Features

- **3D Virtual Try-On** — Interactive Three.js GLB model viewer enabling real-time outfit previews directly in the browser
- **JWT Authentication with Refresh Tokens** — Short-lived access tokens paired with long-lived, revocable refresh tokens for secure sessions
- **Role-Based Access Control (RBAC)** — Admin and user roles enforced via middleware, with protected admin-only endpoints
- **Razorpay Payment Gateway** — Full payment flow (UPI, cards, net banking, COD) with backend HMAC signature verification
- **Redis Caching** — Cache-aside read + write-through update pattern for cart data
- **Input Validation & Centralized Error Handling** — Declarative request validation via express-validator
- **Dockerized** — Full local development environment (app + MongoDB + Redis) via Docker Compose
- **Automated Testing & CI** — Jest/Supertest tests covering auth, cart caching, RBAC, and refresh tokens, run automatically via GitHub Actions

## Tech Stack

**Frontend:** React.js, Three.js, CSS  
**Backend:** Node.js, Express.js  
**Database:** MongoDB Atlas (Mongoose)  
**Caching:** Redis  
**Auth:** JWT (access + refresh tokens), bcrypt  
**Payments:** Razorpay API  
**Validation:** express-validator  
**Testing:** Jest, Supertest, mongodb-memory-server  
**CI/CD:** GitHub Actions  
**Containerization:** Docker, Docker Compose  

## Getting Started

### Option 1: Docker (recommended)

**Prerequisites:** Docker Desktop installed and running.

1. Clone the repository
   ```bash
   git clone https://github.com/SanjanaS10/style-studio.git
   cd style-studio
   ```

2. Create a `.env` file in the root directory:
   ```
   MONGO_URI=mongodb://mongo:27017/stylestudio
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   ```

3. Start everything (app, MongoDB, Redis):
   ```bash
   docker compose up --build
   ```

4. The backend will be available at `http://localhost:5000`.

### Option 2: Local (without Docker)

**Prerequisites:** Node.js, npm, a MongoDB Atlas account (or local MongoDB), a Redis instance, and Razorpay API keys.

1. Clone and install dependencies
   ```bash
   git clone https://github.com/SanjanaS10/style-studio.git
   cd style-studio
   npm install
   ```

2. Create a `.env` file:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   REDIS_URL=redis://localhost:6379
   ```

3. Run the project
   ```bash
   npm run dev
   ```

## Project Structure

```
style-studio/
├── src/                        # React frontend
├── public/                     # Static assets
├── tests/                      # Jest/Supertest test suites
│   ├── auth.test.js
│   ├── cart.test.js
│   └── rbac.test.js
├── .github/workflows/test.yml  # CI pipeline
├── server.js                   # Express backend entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```