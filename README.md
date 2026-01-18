# TestDemo - Comprehensive Test Management System

A modern, full-featured test case management system for managing end-to-end testing lifecycle from requirement gathering to production deployment.

## Features

### Core Features
- ✅ **Test Case Management**: Create, organize, and version test cases with steps and preconditions
- ✅ **Test Execution**: Execute tests across different cycles (smoke, sanity, regression)
- ✅ **Requirements Management**: Track requirements and link to test cases
- ✅ **Defect Management**: Create and track defects with status management
- ✅ **Test Plans & Cycles**: Organize tests into plans and execution cycles
- ✅ **Reporting & Metrics**: Comprehensive dashboards and reports
- ✅ **User Management**: Role-based access control with authentication

### Integrations
- 🔗 **Jira**: Sync stories, defects, and test cases
- 🔗 **Azure DevOps**: Work item and test result synchronization
- 🔗 **CI/CD**: API for automated test execution

## Tech Stack

### Backend
- Node.js 18+ with Express.js
- PostgreSQL 14+ for database
- JWT for authentication
- Prisma ORM for database management
- Winston for logging

### Frontend
- React 18+ with TypeScript
- Material-UI (MUI) for components
- Redux Toolkit for state management
- React Router for navigation
- Axios for API calls
- Chart.js for visualizations

## Project Structure

```
TestDemo/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/       # Business logic
│   │   ├── integrations/   # External integrations (Jira, Azure)
│   │   ├── utils/          # Utilities
│   │   └── config/         # Configuration
│   ├── prisma/             # Database schema and migrations
│   ├── tests/              # Backend tests
│   └── package.json
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities
│   │   └── types/          # TypeScript types
│   ├── public/
│   └── package.json
│
├── docs/                   # Documentation
├── scripts/                # Deployment and utility scripts
└── docker-compose.yml      # Docker setup

```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd TestDemo
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup Database**
```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Start Backend**
```bash
npm run dev
```

6. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

7. **Start Frontend**
```bash
npm start
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/testdemo
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development

# Jira Integration
JIRA_HOST=your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your-api-token

# Azure DevOps Integration
AZURE_DEVOPS_ORG=your-org
AZURE_DEVOPS_PAT=your-personal-access-token
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=development
```

## Default Users

After seeding the database, you can login with:

- **Admin**: admin@testdemo.com / Admin@123
- **Test Manager**: manager@testdemo.com / Manager@123
- **Tester**: tester@testdemo.com / Tester@123

## API Documentation

API documentation is available at `http://localhost:3001/api-docs` when running the backend.

## Features Overview

### 1. Test Case Management
- Create hierarchical test suites
- Define test cases with steps and expected results
- Add preconditions and test data
- Version control for test cases
- Import/Export test cases (Excel, XML)
- Custom fields support

### 2. Test Execution
- Create test plans and builds
- Define test cycles (Smoke, Sanity, Regression, etc.)
- Assign test cases to test cycles
- Execute tests with pass/fail/blocked/skip status
- Add execution notes and attachments
- Bulk test execution

### 3. Requirements Management
- Create and organize requirements
- Link requirements to test cases
- Track requirement coverage
- Requirements traceability matrix
- Import requirements from Jira/Azure DevOps

### 4. Defect Management
- Create defects during test execution
- Link defects to test cases and executions
- Track defect lifecycle
- Integration with Jira and Azure DevOps
- Defect metrics and reports

### 5. Reporting & Analytics
- Test execution dashboard
- Test coverage reports
- Defect density reports
- Execution trends
- Requirements coverage
- Custom reports with filters
- Export reports (PDF, Excel)

### 6. Integrations

#### Jira Integration
- Sync test cases with Jira stories
- Create Jira issues from defects
- Link test executions to Jira stories
- Bi-directional synchronization

#### Azure DevOps Integration
- Sync test cases with Azure Test Plans
- Create work items from defects
- Push test results to Azure
- Link to Azure boards

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
```

## Docker Deployment

```bash
docker-compose up -d
```

This will start:
- Backend API on port 3001
- Frontend on port 3000
- PostgreSQL on port 5432

## Architecture

### Backend Architecture
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic layer
- **Repositories**: Data access layer
- **Middleware**: Authentication, validation, error handling
- **Integrations**: External service connectors

### Frontend Architecture
- **Component-based**: Reusable React components
- **Redux Store**: Centralized state management
- **Services**: API communication layer
- **Custom Hooks**: Reusable logic
- **Route Guards**: Protected routes with authentication

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention with Prisma
- XSS protection
- CORS configuration
- Rate limiting

## Performance

- Database indexing for fast queries
- Pagination for large datasets
- Lazy loading for frontend
- Caching with Redis (optional)
- Optimized database queries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@testdemo.com

## Roadmap

- [ ] Mobile app (React Native)
- [ ] AI-powered test generation
- [ ] GitLab integration
- [ ] GitHub Actions integration
- [ ] Test automation framework integration
- [ ] Advanced analytics with ML
- [ ] Real-time collaboration
- [ ] Video recording of test execution

## Credits

Inspired by TestLink, Zephyr, TestRail, and Xray.

---

**Version**: 1.0.0  
**Last Updated**: January 2026
# TestDemo
