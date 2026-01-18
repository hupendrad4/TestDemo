# TestDemo Project Recovery Information

## Recovery Date
**January 19, 2026**

## Recovery Source
This project was successfully recovered from VSCode's file history cache located at:
`~/.config/Code/User/History/`

## Original Location
`/tmp/TestDemo`

## New Location
`/home/aumni/Hupendra/Hupendra Work/TestDemo`

## Recovery Statistics
- **Total Files Recovered**: 84
- **Success Rate**: 100%
- **Failed Files**: 0

## Project Overview
TestDemo is a comprehensive Test Management System for managing end-to-end testing lifecycle.

### Technology Stack
- **Backend**: Node.js 18+, Express.js, PostgreSQL 14+, Prisma ORM
- **Frontend**: React 18+, TypeScript, Material-UI, Redux Toolkit
- **Integrations**: Jira, Azure DevOps

### Key Features
- Test Case Management
- Test Execution & Tracking
- Requirements Management
- Defect Management
- Comprehensive Reporting & Analytics
- Role-based Access Control
- External Integrations (Jira, Azure DevOps)

## Project Structure
```
TestDemo/
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── controllers/   # 11 controllers
│   │   ├── routes/        # 11 routes
│   │   ├── middleware/    # 4 middleware files
│   │   ├── types/         # TypeScript definitions
│   │   ├── utils/         # Utilities
│   │   └── server.ts      # Main server file
│   ├── prisma/            # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # React/TypeScript UI
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store & slices
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                  # Documentation
│   ├── API.md
│   └── INSTALLATION.md
│
├── docker-compose.yml
├── README.md
├── GETTING_STARTED.md
├── PROJECT_SUMMARY.md
└── LICENSE
```

## Next Steps to Run the Project

### 1. Backend Setup
```bash
cd "/home/aumni/Hupendra/Hupendra Work/TestDemo/backend"
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 2. Frontend Setup
```bash
cd "/home/aumni/Hupendra/Hupendra Work/TestDemo/frontend"
npm install
npm start
```

### 3. Using Docker
```bash
cd "/home/aumni/Hupendra/Hupendra Work/TestDemo"
docker-compose up -d
```

## Default Credentials
After seeding:
- **Admin**: admin@testdemo.com / Admin@123
- **Manager**: manager@testdemo.com / Manager@123
- **Tester**: tester@testdemo.com / Tester@123

## Configuration Required

### Backend Environment Variables (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/testdemo
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

### Frontend Environment Variables (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=development
```

## Recovered Files List

### Backend (45 files)
- Controllers: 11 files
- Routes: 11 files
- Middleware: 4 files
- Configuration files
- Prisma schema
- Docker configuration

### Frontend (33 files)
- Components: Layout, PrivateRoute
- Pages: Auth, Dashboard, Projects, TestCases, TestPlans, Requirements, Defects, Executions, Reports, Users, Admin, Settings
- Services: API integration services
- Store: Redux slices
- Configuration files

### Documentation (6 files)
- README.md
- GETTING_STARTED.md
- PROJECT_SUMMARY.md
- API.md
- INSTALLATION.md
- CHANGELOG.md
- CONTRIBUTING.md

## Important Notes

1. **Install Dependencies**: Run `npm install` in both backend and frontend directories
2. **Database Setup**: Configure PostgreSQL and run migrations
3. **Environment Variables**: Update .env files with your configuration
4. **Port Configuration**: Backend runs on 3001, Frontend on 3000
5. **Security**: Change default JWT_SECRET and passwords

## Recovery Method Used
The project was recovered using a custom bash script that:
1. Scanned VSCode's History folder for TestDemo file references
2. Mapped original file paths from entries.json
3. Located cached file contents
4. Restored files to the new location with correct directory structure

## Project Status
✅ All files recovered successfully
✅ Project structure intact
✅ Ready for setup and deployment

For any issues or questions, refer to the documentation files or contact support.
