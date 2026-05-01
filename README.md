# Parksphere

Parksphere is a smart parking reservation and management platform built with a React frontend, an Express backend, and PostgreSQL for deployment-ready data storage. The project supports both drivers and parking-lot owners, and it also includes PL/SQL artifacts for DBMS-project documentation and viva use.

## Features

- Driver registration and login
- Owner registration and login
- Nearby parking search using current location
- Parking-slot reservation for cars and bikes
- Owner-side parking lot creation
- Owner-side parking lot update and delete
- Reservation and payment record storage
- PostgreSQL-ready backend for deployment
- PL/SQL script file for academic DBMS submission support

## Tech Stack

- Frontend: `React`, `Vite`, `React Router`, `React Leaflet`
- Backend: `Node.js`, `Express`
- Authentication: `JWT`, `bcryptjs`
- Database: `PostgreSQL`
- Deployment target: `Render` or any Node + Postgres hosting setup

## Database Used

The running deployed app uses:

- `PostgreSQL`
- Driver package: `pg`

The database is connected through:

- `DATABASE_URL`

## PL/SQL Included

The project also includes a DBMS-oriented PL/SQL file:

- `server/plsql/parkphere_plsql.sql`

Included PL/SQL objects:

- `calculate_booking_amount` function
- `trg_vehicle_number_upper` trigger
- `create_reservation_with_payment` procedure
- `owner_monthly_revenue` procedure

Note:

- The live deployed application runs on PostgreSQL
- The PL/SQL file is included for DBMS project/report/viva purposes

## Main Modules

### Driver Side

- Browse all parking areas
- Search nearby parking from current location
- View slot availability
- Make reservations
- View recent bookings

### Owner Side

- Register a parking lot
- Auto-fill coordinates from current location
- Update parking lot information
- Delete parking lots
- View recent booking activity
- View income-related dashboard stats

## Environment Variables

Create a `.env` file in the project root.

Use this format:

```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
JWT_SECRET=replace-with-a-secure-secret
PORT=8787
VITE_API_BASE_URL=http://localhost:8787/api
```

You can copy from:

- `.env.example`

## Local Setup

1. Extract the project
2. Create `.env` from `.env.example`
3. Add your PostgreSQL `DATABASE_URL`
4. Install dependencies:
   `npm install`
5. Start frontend:
   `npm run dev`
6. Start backend in another terminal:
   `npm run dev:server`

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

## How the Database Initializes

On backend start:

- the app connects to PostgreSQL
- runs `server/sql/schema.sql`
- checks if the `users` table is empty
- seeds demo users from `server/sql/seed.sql` if needed

## Database Tables

Main tables:

- `users`
- `parking_areas`
- `reservations`
- `payments`

### Relationships

- One owner can own many parking areas
- One user can create many reservations
- One reservation maps to one payment
- Reservations are linked to parking areas

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Parking:

- `GET /api/parking-areas`
- `GET /api/parking-areas/nearby`
- `GET /api/owner/parking-areas`
- `POST /api/parking-areas`
- `PUT /api/parking-areas/:areaId`
- `DELETE /api/parking-areas/:areaId`

Reservations:

- `GET /api/reservations/me`
- `POST /api/reservations`

Health:

- `GET /api/health`

## Deployment on Render

### 1. Create PostgreSQL

In Render:

1. Open your project
2. Click `New`
3. Choose `Postgres`
4. Create the database
5. Copy the `External Database URL`

### 2. Deploy Backend

Create a Render `Web Service` and set:

- Build Command: `npm install`
- Start Command: `npm start`

Backend env vars:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

### 3. Deploy Frontend

Create a Render `Static Site` and set:

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Frontend env var:

- `VITE_API_BASE_URL=https://your-backend-url.onrender.com/api`

## Project Structure

```text
src/
  components/
  context/
  lib/
  pages/
server/
  plsql/
  sql/
  database.js
  index.js
public/
.env.example
package.json
README.md
```

## Important Files

- `src/pages/HomePage.jsx` - landing page
- `src/pages/AuthPage.jsx` - login/register page
- `src/pages/UserDashboard.jsx` - driver dashboard
- `src/pages/OwnerDashboard.jsx` - owner dashboard
- `src/components/ParkingMap.jsx` - map and current-location view
- `src/lib/api.js` - frontend API layer
- `server/index.js` - backend routes
- `server/database.js` - PostgreSQL setup
- `server/sql/schema.sql` - schema file
- `server/sql/seed.sql` - seed file
- `server/plsql/parkphere_plsql.sql` - PL/SQL script

## Demo Accounts

- Driver: `customer1@gmail.com` / `123`
- Owner: `owner1@gmail.com` / `123`

## Notes

- The project is prepared for deployment with PostgreSQL
- Owner parking lots now support update and delete actions
- Delete action is available with a bin icon in the owner dashboard
- Current-location integration is used in both user and owner flows

## Future Improvements

- Real payment gateway integration
- Booking cancellation and refund flow
- Admin panel
- Better owner analytics and charts
- Image uploads for parking lots

## License

This project is for academic, learning, and demonstration purposes.
