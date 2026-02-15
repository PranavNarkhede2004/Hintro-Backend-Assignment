# Smart Airport Ride Pooling Backend 🚖

A backend system for an airport ride pooling service that intelligently groups passengers into shared cabs to optimize routes and reduce costs.

## 🚀 Features

- **Ride Matching Engine**: Groups passengers based on proximity (3km pickup, 5km dropoff) and time window (15 mins).
- **Dynamic Pricing**: Real-time fare calculation adjusting to demand/supply ratio.
- **Concurrency Safety**: Transaction-based booking with optimistic locking to prevent overbooking vehicles.
- **REST API**: Endpoints for creating bookings and triggering the matching simulation.
- **Dockerized**: Easy setup with Docker Compose.

---

## 🛠 Tech Stack

- **Language**: TypeScript (Node.js)
- **Framework**: Express.js
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma (v7 with `@prisma/adapter-pg`)
- **Testing**: Jest / custom test scripts with `ts-node`

---

## 📋 Prerequisites

- **Node.js** (v18+)
- **Docker Desktop** (Running)

---

## ⚙️ Setup & Installation

1.  **Clone the Repository**
    ```bash
    git clone <repo-url>
    cd hintro-assignment
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory (or use the example provided):
    ```bash
    PORT=3000
    DATABASE_URL="postgresql://admin:password@localhost:5432/ride_pooling?schema=public"
    ```

4.  **Start Database**
    Launch the PostgreSQL container:
    ```bash
    docker-compose up -d
    ```

5.  **Run Migrations**
    Apply the database schema:
    ```bash
    npx prisma migrate dev --name init
    ```

6.  **Seed Data (Optional)**
    Populate the database with sample users and vehicles:
    ```bash
    npx ts-node prisma/seed.ts
    ```

---

## ▶️ Running the Application

**Development Mode:**
```bash
npm run dev
```
Server will start on `http://localhost:3000` (or `http://127.0.0.1:3000`).

**Build & Start:**
```bash
npm run build
npm start
```

---

## 🧪 Testing

We have included several test scripts to verify the system:

1.  **Unit Tests** (Algorithm Logic):
    ```bash
    npx ts-node src/tests/matching.test.ts
    ```
2.  **Integration Tests** (End-to-End API Flow):
    ```bash
    npx ts-node src/tests/integration.test.ts
    ```
3.  **Load Tests** (Concurrency Verification):
    ```bash
    npx ts-node src/tests/load.test.ts
    ```

---

## 📚 API Documentation

### 1. Create Booking
Create a new ride request.

- **Endpoint**: `POST /api/bookings`
- **Body**:
  ```json
  {
    "userId": "user-uuid",
    "pickup": { "lat": 12.9716, "lng": 77.5946 },
    "dropoff": { "lat": 13.1986, "lng": 77.7066 },
    "pickupTime": "2023-10-27T10:00:00Z",
    "passengers": 1
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Booking created successfully",
    "bookingId": "booking-uuid",
    "estimatedPrice": 450.50,
    "status": "PENDING"
  }
  ```

### 2. Trigger Matching Simulation
Manually trigger the matching engine to group pending bookings into rides.

- **Endpoint**: `POST /api/trigger-matching`
- **Response (200 OK)**:
  ```json
  {
    "message": "Matching completed",
    "matchesFound": 1,
    "details": [ ... ]
  }
  ```

### 3. Check Booking Status
- **Endpoint**: `GET /api/bookings/:id`
- **Response**:
  ```json
  {
    "bookingId": "uuid",
    "status": "MATCHED",
    "rideId": "ride-uuid",
    "driverId": "vehicle-uuid",
    "estimatedPrice": 450.50
  }
  ```

### 4. Check Health
- **Endpoint**: `GET /health`
- **Response**: `{ "status": "ok", "timestamp": "..." }`

---

## 🧠 Algorithm Complexity

The ride matching logic uses a **Greedy Heuristic approach**:

1.  **Time Complexity**: `O(N * M)`
    - `N`: Number of pending requests.
    - `M`: Max capacity of a vehicle (constant, small, e.g., 3).
    - Sorting takes `O(N log N)`.
    - Iterating through sorted requests and checking "active groups" (limited window) is roughly linear `O(N)` in practice due to time window constraints, but worst case `O(N^2)` if all requests are in the same window.

2.  **Space Complexity**: `O(N)`
    - Storing pending requests and forming groups.

The greedy approach matches the "best available" option immediately rather than finding the global optimum (which would be NP-Hard VRP), satisfying the requirement for speed and scalability.

---

## 📝 Assumptions

- **Simplified Routing**: We use **Haversine Distance** (straight line) for proximity checks instead of real-time road network distance (Google Maps API) to avoid external dependencies/costs for this assignment.
- **Single Vehicle Type**: All vehicles have a capacity of 3 passengers.
- **Optimistic Locking**: We use `isAvailable` boolean for concurrency control. In a production distributed system, we might use Redis distributed locks or row-level locking (`SELECT FOR UPDATE`).

---

## 📂 Project Structure

```
├── src
│   ├── algorithm/       # Core matching logic (DSA)
│   ├── controllers/     # API handlers
│   ├── pricing/         # Dynamic pricing engine
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions (distance calc)
│   ├── app.ts           # Express app setup
│   ├── db.ts            # Prisma Database client
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data script
├── docker-compose.yml   # Docker setup
└── README.md            # Documentation
```
