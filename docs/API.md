# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TESTER"
    },
    "token": "jwt_token"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TESTER"
    },
    "token": "jwt_token"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TESTER",
    "isActive": true,
    "lastLogin": "2024-01-18T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Project Endpoints

### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Project",
  "prefix": "MP",
  "description": "Project description",
  "isPublic": false
}
```

### Get All Projects
```http
GET /projects
Authorization: Bearer <token>
```

### Get Project by ID
```http
GET /projects/:id
Authorization: Bearer <token>
```

### Update Project
```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

### Delete Project
```http
DELETE /projects/:id
Authorization: Bearer <token>
```

## Test Case Endpoints

### Create Test Case
```http
POST /test-cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Test Case 1",
  "summary": "Test case summary",
  "preconditions": "Prerequisites",
  "testSuiteId": "uuid",
  "priority": "HIGH",
  "executionType": "MANUAL",
  "steps": [
    {
      "stepNumber": 1,
      "action": "Open application",
      "expectedResult": "Application opens successfully"
    }
  ]
}
```

### Get All Test Cases
```http
GET /test-cases?testSuiteId=uuid&status=APPROVED&priority=HIGH
Authorization: Bearer <token>
```

### Get Test Case by ID
```http
GET /test-cases/:id
Authorization: Bearer <token>
```

### Update Test Case
```http
PUT /test-cases/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Test Case",
  "status": "APPROVED"
}
```

### Delete Test Case
```http
DELETE /test-cases/:id
Authorization: Bearer <token>
```

## Test Execution Endpoints

### Create Execution
```http
POST /executions
Authorization: Bearer <token>
Content-Type: application/json

{
  "testCaseId": "uuid",
  "testCycleId": "uuid",
  "buildId": "uuid",
  "status": "PASSED",
  "notes": "Test execution notes",
  "executionTime": 30,
  "stepExecutions": [
    {
      "testStepId": "uuid",
      "status": "PASSED",
      "actualResult": "As expected"
    }
  ]
}
```

### Get All Executions
```http
GET /executions?testPlanId=uuid&status=PASSED
Authorization: Bearer <token>
```

## Defect Endpoints

### Create Defect
```http
POST /defects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Bug Title",
  "description": "Bug description",
  "severity": "HIGH",
  "priority": "CRITICAL",
  "stepsToReproduce": "Steps to reproduce",
  "expectedBehavior": "Expected",
  "actualBehavior": "Actual"
}
```

### Get All Defects
```http
GET /defects?status=OPEN&severity=HIGH
Authorization: Bearer <token>
```

### Update Defect
```http
PUT /defects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "assignedToId": "uuid"
}
```

## Report Endpoints

### Get Dashboard Metrics
```http
GET /reports/dashboard?projectId=uuid
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTestCases": 100,
    "totalExecutions": 250,
    "passedTests": 200,
    "failedTests": 30,
    "blockedTests": 20,
    "openDefects": 15,
    "testCoverage": 85.5
  }
}
```

### Get Test Coverage Report
```http
GET /reports/test-coverage?projectId=uuid
Authorization: Bearer <token>
```

### Get Execution Summary
```http
GET /reports/execution-summary?testPlanId=uuid&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "message": "Error message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API is rate limited to:
- 100 requests per 15 minutes for general endpoints
- 5 requests per 15 minutes for authentication endpoints

## Interactive API Documentation

Visit `http://localhost:3001/api/docs` for interactive Swagger documentation.
