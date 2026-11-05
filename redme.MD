
# CommunityBond API

CommunityBond API is the backend service for the CommunityBond social development events platform.

It provides RESTful APIs for community events, volunteer registrations, event management, image uploads, and newsletter subscriptions.

## Live Links

**Backend API:** YOUR_BACKEND_LIVE_URL

**Frontend Website:** YOUR_FRONTEND_LIVE_URL

**Server Repository: https://github.com/cybersumon/communitybond-server

## Features

1. RESTful event management API.
2. Create, read, update, and delete community events.
3. JWT-based authentication and authorization.
4. Organizer ownership verification.
5. Volunteer event registration.
6. Duplicate registration prevention.
7. Leave event functionality.
8. Organizer participant management.
9. MongoDB Atlas database integration.
10. Event image uploads using Multer and Sharp.
11. Newsletter subscription management.
12. Request validation and error handling.
13. API health checking.

## Technology Stack

- Node.js
- Express.js
- TypeScript
- MongoDB Atlas
- JWT
- Zod
- Multer
- Sharp

## Project Structure

```text
communitybond-server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/cybersumon/communitybond-server
cd communitybond-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file.

Example:

```env
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb_connection_string
DB_NAME= database_name
```

Configure any additional JWT verification or email service variables required by the application.

### 4. Start Development Server

```bash
npm run dev
```

Local API:

http://localhost:5001

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |
| GET | `/api/events` | Get events |
| GET | `/api/events/recent` | Get recent event previews |
| GET | `/api/events/:id` | Get event details |
| POST | `/api/events` | Create an event |
| PATCH | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |
| POST | `/api/events/:id/join` | Join an event |
| DELETE | `/api/events/:id/join` | Leave an event |
| GET | `/api/events/joined` | Get joined events |
| GET | `/api/events/:id/participants` | Get event participants |
| POST | `/api/uploads` | Upload event images |
| POST | `/api/subscribers` | Subscribe to cause alerts |
| POST | `/api/subscribers/unsubscribe` | Unsubscribe from alerts |

Protected endpoints require a valid authentication token.

## Database

MongoDB Atlas is used for storing event information, volunteer registrations, and subscriber data.

The application establishes a database connection during server startup.

## Authentication and Authorization

The backend validates JWTs issued by the application's authentication system.

Protected operations verify the authenticated user.

Only an event organizer can modify or delete their own events.

## Image Upload

The backend supports JPG, PNG, and WebP image uploads using Multer and Sharp.

Uploaded images can be processed and served through the application's upload routes.

Production deployments require persistent image storage.

## Validation

Server-side request validation is implemented using Zod.

Validation helps protect event creation, updates, and registration endpoints against invalid requests.

## Development Commands

Start development:

```bash
npm run dev
```

Type checking:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Production start:

```bash
npm start
```

## Deployment

The backend can be deployed on Render or another Node.js hosting provider.

Before deployment:

- Configure MongoDB Atlas.
- Configure the frontend CORS origin.
- Configure JWT verification.
- Configure environment variables.
- Configure persistent image storage.
- Verify the health endpoint.

## Security

- JWT authentication.
- Organizer authorization.
- Request validation.
- Protected API endpoints.
- Secure environment variables.
- CORS configuration.
- Error handling.

## Project Information

**Project:** CommunityBond

**Assignment:** B14-A08

**Type:** Express.js REST API

**Database:** MongoDB Atlas

**Language:** TypeScript

## Author

Developed as part of the B14-A08 full-stack web development assignment.

## License

This project was developed for educational purposes.
