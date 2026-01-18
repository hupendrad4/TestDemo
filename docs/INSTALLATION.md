# Installation Guide

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
cp .env.example .env
```

Edit `.env` with your database and configuration details.

### 4. Run database migrations
```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Seed the database (optional)
```bash
npx prisma db seed
```

### 7. Start the backend server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The backend will be available at `http://localhost:3001`

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
cp .env.example .env
```

Edit `.env` if needed (default should work for local development).

### 4. Start the frontend
```bash
# Development
npm start

# Production build
npm run build
```

The frontend will be available at `http://localhost:3000`

## Docker Setup (Recommended for Production)

### 1. Ensure Docker and Docker Compose are installed

### 2. Run Docker Compose
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend on port 3000

### 3. Check logs
```bash
docker-compose logs -f
```

### 4. Stop services
```bash
docker-compose down
```

## Database Management

### View database
```bash
cd backend
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to manage your database.

### Create new migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset database
```bash
npx prisma migrate reset
```

## Testing

### Backend tests
```bash
cd backend
npm test
```

### Frontend tests
```bash
cd frontend
npm test
```

## Common Issues

### Port already in use
If ports 3000 or 3001 are in use, either:
- Stop the service using that port
- Change the PORT in `.env` file

### Database connection issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify credentials

### Node modules issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After installation:
1. Open browser to `http://localhost:3000`
2. Register a new account
3. Login and start using TestDemo!

For more details, see the [README.md](README.md)
