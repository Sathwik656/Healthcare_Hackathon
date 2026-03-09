# 🏥 Healthcare Appointment Booking Platform — Backend API

Node.js + Express + PostgreSQL + Socket.IO backend with **server-side cookie authentication**.

---

## 🔐 Authentication Model

This API uses **httpOnly cookie-based JWT authentication**.

- On **login / register** → server calls `res.cookie('auth_token', token, { httpOnly: true })`
- The browser/client **never sees** the raw JWT — it lives only in an httpOnly cookie
- On **logout** → server calls `res.clearCookie('auth_token')` — session is immediately invalidated
- All protected routes read the token from `req.cookies.auth_token`
- Socket.IO handshake also reads the cookie from `socket.handshake.headers.cookie`

> **Frontend requirement**: All fetch/axios calls must include `credentials: 'include'` (fetch) or `withCredentials: true` (axios) so the browser sends the cookie.

---

## 🗂 Project Structure

```
healthcare-api/
├── sql/
│   └── schema.sql               ← Full database schema
├── src/
│   ├── config/
│   │   ├── db.js                ← PostgreSQL pool
│   │   └── initDb.js            ← Run schema against DB
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   ├── adminController.js
│   │   ├── notificationController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   ├── auth.js              ← authenticate + authorise(roles)
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── doctors.js
│   │   ├── patients.js
│   │   ├── appointments.js
│   │   ├── admin.js
│   │   ├── notifications.js
│   │   └── ai.js
│   ├── services/
│   │   ├── notificationService.js  ← DB persist + WS emit
│   │   └── aiService.js            ← Symptom → specialty matching
│   ├── utils/
│   │   ├── jwt.js               ← issueToken, clearToken, verifyToken
│   │   └── response.js          ← success() / error() helpers
│   ├── websocket/
│   │   └── socketHandler.js     ← Socket.IO setup + room management
│   ├── app.js                   ← Express app
│   └── server.js                ← HTTP + Socket.IO server entry point
├── .env.example
└── package.json
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secrets
```

### 3. Create the database
```sql
CREATE DATABASE healthcare_db;
```

### 4. Run the schema
```bash
npm run db:init
```

### 5. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 📡 REST API Reference

### Authentication — `/auth`

| Method | Endpoint        | Auth | Description |
|--------|----------------|------|-------------|
| POST   | /auth/register  | —    | Register as patient. Sets auth cookie. |
| POST   | /auth/login     | —    | Login. Sets httpOnly auth cookie. |
| POST   | /auth/logout    | ✓    | Clears auth cookie server-side. |
| GET    | /auth/me        | ✓    | Returns current user + roles. |

**Register / Login request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+1234567890"
}
```

---

### Doctors — `/doctors`

| Method | Endpoint                 | Auth    | Role   | Description |
|--------|--------------------------|---------|--------|-------------|
| GET    | /doctors                 | —       | —      | List active doctors (with ?specialty_id=, ?search=) |
| GET    | /doctors/:doctor_id      | —       | —      | Get doctor details |
| PUT    | /doctors/profile         | ✓       | doctor | Update own profile |

---

### Patients — `/patients`

| Method | Endpoint          | Auth | Role    | Description |
|--------|------------------|------|---------|-------------|
| GET    | /patients/profile | ✓    | patient | Get patient profile |
| PUT    | /patients/profile | ✓    | patient | Update patient profile |

---

### Appointments — `/appointments`

| Method | Endpoint                          | Auth | Role    | Description |
|--------|----------------------------------|------|---------|-------------|
| POST   | /appointments                     | ✓    | patient | Book appointment |
| GET    | /appointments/patient             | ✓    | patient | My appointments |
| GET    | /appointments/doctor              | ✓    | doctor  | My appointments |
| PUT    | /appointments/:id/cancel          | ✓    | patient | Cancel appointment |
| PUT    | /appointments/:id/accept          | ✓    | doctor  | Accept appointment |
| PUT    | /appointments/:id/decline         | ✓    | doctor  | Decline appointment |

**Book appointment body:**
```json
{
  "doctor_id": "uuid",
  "appointment_date": "2025-02-15",
  "appointment_time": "10:00",
  "reason": "Chest pain follow-up"
}
```

---

### Admin — `/admin`

| Method | Endpoint                            | Auth | Role  | Description |
|--------|-------------------------------------|------|-------|-------------|
| GET    | /admin/doctors                      | ✓    | admin | All doctors |
| POST   | /admin/doctors                      | ✓    | admin | Create doctor |
| PUT    | /admin/doctors/:doctor_id/suspend   | ✓    | admin | Suspend doctor |
| PUT    | /admin/doctors/:doctor_id/activate  | ✓    | admin | Re-activate doctor |
| GET    | /admin/appointments                 | ✓    | admin | All appointments |
| PUT    | /admin/appointments/:id             | ✓    | admin | Modify appointment |

---

### Notifications — `/notifications`

| Method | Endpoint                     | Auth | Description |
|--------|------------------------------|------|-------------|
| GET    | /notifications                | ✓    | List notifications (with unread count) |
| PUT    | /notifications/read-all       | ✓    | Mark all read |
| PUT    | /notifications/:id/read       | ✓    | Mark one read |

---

### AI Recommendations — `/ai`

| Method | Endpoint              | Auth | Role    | Description |
|--------|-----------------------|------|---------|-------------|
| POST   | /ai/recommend         | ✓    | patient | Get specialty/doctor suggestion from symptoms |
| GET    | /ai/recommendations   | ✓    | patient | List past recommendations |

**Recommend body:**
```json
{ "symptoms": "I have chest pain and shortness of breath" }
```

---

## 📡 WebSocket Events (Socket.IO)

Connect with `credentials: true` so the auth cookie is sent in the handshake.

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true   // sends auth_token cookie automatically
});
```

Upon connection the server joins the user to room `user_{user_id}`.

### Server → Client events

| Event                 | Recipient    | Triggered when |
|-----------------------|-------------|----------------|
| `new_appointment`     | Doctor room | Patient books an appointment |
| `appointment_accepted`| Patient room| Doctor accepts |
| `appointment_declined`| Patient room| Doctor declines |
| `appointment_cancelled`| Doctor room | Patient cancels |
| `doctor_suspended`    | Doctor room | Admin suspends |

### Client → Server events

| Event                    | Payload                | Description |
|--------------------------|------------------------|-------------|
| `mark_notification_read` | `{ notification_id }`  | Mark a notification read via WS |
| `ping`                   | —                      | Health check |

---

## 🛡 Security Notes

- JWT stored in **httpOnly, SameSite, Secure** cookie — no XSS access
- Passwords hashed with **bcrypt (cost 12)**
- Role-based middleware on every protected route
- Global rate limit: **200 req / 15 min**
- Auth route limit: **20 req / 15 min**
- Helmet for HTTP security headers
- CORS restricted to `ALLOWED_ORIGINS`
