# StealthyLabs Backend

Backend API for StealthyLabs - Built with Node.js, Express, Prisma, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **ORM**: Prisma 5
- **Database**: PostgreSQL 15+
- **Auth**: JWT + Argon2id
- **Validation**: Zod + express-validator
- **Language**: TypeScript

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure DATABASE_URL in .env
```

## Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (development)
npm run prisma:migrate

# Run migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio (optional)
npm run prisma:studio
```

## Development

```bash
# Run in watch mode with tsx
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Prisma schema (database models)
│   └── migrations/      # Database migrations
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── controllers/     # Request/response handlers
│   └── validators/      # Request validation schemas
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_ACCESS_TTL` | Access token TTL | 15m |
| `JWT_REFRESH_TTL` | Refresh token TTL | 7d |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:5173 |

## Database Schema

The database follows the specifications in `database_schema.md`:

- `users` - User accounts with GDPR compliance
- `items` - Game items (weapons, blueprints, etc.)
- `user_favorites` - User-item favorites (many-to-many)
- `auth_sessions` - Refresh tokens and session metadata
- `email_verification_tokens` - Email verification tokens

## API Documentation

See `api_routes.md` for detailed API specifications.

## Security

- Passwords hashed with Argon2id
- Refresh tokens stored hashed
- JWT access tokens with short TTL
- GDPR compliant with soft delete and data minimization
- Rate limiting on endpoints
- Helmet security headers
- CORS properly configured

## License

MIT