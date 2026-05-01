# Parksphere DBMS Project

Parksphere is a parking platform project prepared for a DBMS-oriented submission and deployment setup. The app now includes:

- A React + Vite frontend
- A Node/Express backend
- A PostgreSQL database layer for deployment
- Extra PL/SQL scripts for DBMS project presentation, report, or viva discussion

## What Changed

- Replaced the local SQLite runtime with PostgreSQL using `pg`
- Added environment-based database configuration through `DATABASE_URL`
- Kept relational schema in `server/sql/schema.sql`
- Kept seed data in `server/sql/seed.sql`
- Added `.env.example` for deployment configuration
- Added Oracle-style PL/SQL program units in `server/plsql/parkphere_plsql.sql`

## Run Locally

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` to your PostgreSQL database
3. Install dependencies:
   `npm install`
4. Start the frontend:
   `npm run dev`
5. Start the backend in another terminal:
   `npm run dev:server`

Frontend default URL:
`http://localhost:5173`

Backend default URL:
`http://localhost:8787`

The backend will create the PostgreSQL tables automatically on first start and seed demo users if the `users` table is empty.

## Database Design

Main SQL tables:

- `users`
- `parking_areas`
- `reservations`
- `payments`

Relationships:

- One owner can manage many parking areas
- One user can create many reservations
- One reservation creates one payment record

## PL/SQL Content Added

The PL/SQL script includes:

- `calculate_booking_amount` function
- `trg_vehicle_number_upper` trigger
- `create_reservation_with_payment` procedure
- `owner_monthly_revenue` procedure

These are included to strengthen the DBMS project aspect even though the runnable deployed backend uses PostgreSQL.

## Main Project Structure

- `src/` frontend app
- `server/index.js` backend API
- `server/database.js` PostgreSQL initialization
- `server/sql/` schema and seed scripts
- `server/plsql/` PL/SQL objects for DBMS submission
- `public/` static assets

## Demo Accounts

- Driver: `customer1@gmail.com` / `123`
- Operator: `owner1@gmail.com` / `123`
