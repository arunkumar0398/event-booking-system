# Event Booking System API

A robust event booking system with role-based access control, built with Node.js, Express, and MongoDB.

## Features

- JWT-based authentication
- Role-based access control (Organizers & Customers)
- Event management (CRUD operations)
- Ticket booking system with seat management
- Atomic transactions for booking concurrency
- Background jobs for notifications
- Input validation and error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose v9
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Job Queue**: Custom in-memory queue

## Installation

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file (see Environment Variables below)
4. Start MongoDB
5. Run: `npm run dev`

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/event_booking_system
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRE=24h
CLIENT_URL=http://localhost:3000
```

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| GET | `/api/auth/me` | Private | Get current user |

### Events
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/events` | Public | Get all events |
| GET | `/api/events/:id` | Public | Get event details |
| POST | `/api/events` | Organizer | Create event |
| PUT | `/api/events/:id` | Organizer | Update own event |
| DELETE | `/api/events/:id` | Organizer | Delete own event |

### Bookings
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | Customer | Create booking |
| GET | `/api/bookings/my` | Customer | Get my bookings |
| GET | `/api/bookings/event/:eventId` | Organizer | Get event bookings |
| PATCH | `/api/bookings/:id/cancel` | Customer | Cancel booking |

## Design Decisions

### 1. Authentication Strategy
**Choice**: JWT-based stateless authentication
**Reason**: Scalable, no server-side sessions, industry standard for REST APIs

### 2. Concurrency Handling
**Choice**: MongoDB transactions with atomic `$inc` operations
**Reason**: Prevents overbooking when multiple users book simultaneously

### 3. Background Jobs
**Choice**: In-memory queue (demo); BullMQ with Redis for production
**Reason**: Demonstrates async processing patterns without external dependencies

### 4. Database Schema
**Choice**: Normalized collections with ObjectId references
**Reason**: Prevents data duplication, supports complex queries

### 5. Error Handling
**Choice**: Centralized error middleware
**Reason**: Consistent error responses across all endpoints

### 6. Role-Based Access Control
**Choice**: Middleware-based RBAC with two roles (organizer, customer)
**Reason**: Clean separation of concerns, reusable across routes

## Testing with curl

```bash
# Register organizer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123","role":"organizer"}'

# Register customer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@test.com","password":"pass123","role":"customer"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'

# Create event (use token from login)
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tech Conf 2026","description":"Annual technology conference","date":"2026-06-01T10:00:00Z","location":"SF Convention Center","totalSeats":100,"price":99.99}'

# Book tickets (customer token)
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"EVENT_ID","numberOfTickets":2}'
```

## Project Structure

```
event-booking-system/
├── src/
│   ├── config/database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Booking.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   └── booking.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   └── booking.routes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── jobs/queue.js
│   ├── utils/jwt.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Production Improvements

- Redis-backed job queue (BullMQ)
- Email service integration (SendGrid/AWS SES)
- Payment processing (Stripe)
- Rate limiting
- Request validation (express-validator)
- API documentation (Swagger)
- Unit & integration tests
- Caching layer (Redis)
- Structured logging (Winston)

## License

MIT
