import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@testdemo.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@testdemo.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Test Manager User
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@testdemo.com' },
    update: {},
    create: {
      username: 'testmanager',
      email: 'manager@testdemo.com',
      passwordHash: managerPassword,
      firstName: 'Test',
      lastName: 'Manager',
      role: 'TEST_MANAGER',
      isActive: true,
    },
  });
  console.log('✅ Test Manager user created:', manager.email);

  // Create Tester User
  const testerPassword = await bcrypt.hash('Tester@123', 10);
  const tester = await prisma.user.upsert({
    where: { email: 'tester@testdemo.com' },
    update: {},
    create: {
      username: 'tester',
      email: 'tester@testdemo.com',
      passwordHash: testerPassword,
      firstName: 'Test',
      lastName: 'Engineer',
      role: 'TESTER',
      isActive: true,
    },
  });
  console.log('✅ Tester user created:', tester.email);

  // Create Sample Projects
  const project1 = await prisma.testProject.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Project',
      prefix: 'DEMO',
      description: 'Sample project for testing',
      createdById: admin.id,
      isActive: true,
    },
  });
  console.log('✅ Sample project created:', project1.name);

  const project2 = await prisma.testProject.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'E-Commerce Test Suite',
      prefix: 'ECOM',
      description: 'Testing suite for e-commerce application',
      createdById: manager.id,
      isActive: true,
    },
  });
  console.log('✅ Sample project created:', project2.name);

  // Create Sample Test Suite for Demo Project
  const testSuite = await prisma.testSuite.create({
    data: {
      name: 'Login Test Suite',
      description: 'Test cases for login functionality',
      testProjectId: project1.id,
    },
  });
  console.log('✅ Test Suite created:', testSuite.name);

  // Create Sample Test Cases
  const testCase1 = await prisma.testCase.create({
    data: {
      externalId: 'DEMO-1',
      name: 'Verify successful login with valid credentials',
      summary: 'Test case to verify user can login with valid username and password',
      preconditions: 'User should have valid credentials',
      priority: 'HIGH',
      status: 'APPROVED',
      executionType: 'MANUAL',
      testSuiteId: testSuite.id,
      createdById: admin.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Navigate to login page',
            expectedResult: 'Login page should be displayed',
          },
          {
            stepNumber: 2,
            action: 'Enter valid username',
            expectedResult: 'Username field should accept input',
          },
          {
            stepNumber: 3,
            action: 'Enter valid password',
            expectedResult: 'Password field should accept input',
          },
          {
            stepNumber: 4,
            action: 'Click on Login button',
            expectedResult: 'User should be logged in and redirected to dashboard',
          },
        ],
      },
    },
  });
  console.log('✅ Test Case created:', testCase1.externalId);

  const testCase2 = await prisma.testCase.create({
    data: {
      externalId: 'DEMO-2',
      name: 'Verify login fails with invalid password',
      summary: 'Test case to verify user cannot login with invalid password',
      preconditions: 'User should have valid username',
      priority: 'MEDIUM',
      status: 'APPROVED',
      executionType: 'MANUAL',
      testSuiteId: testSuite.id,
      createdById: admin.id,
      steps: {
        create: [
          {
            stepNumber: 1,
            action: 'Navigate to login page',
            expectedResult: 'Login page should be displayed',
          },
          {
            stepNumber: 2,
            action: 'Enter valid username',
            expectedResult: 'Username field should accept input',
          },
          {
            stepNumber: 3,
            action: 'Enter invalid password',
            expectedResult: 'Password field should accept input',
          },
          {
            stepNumber: 4,
            action: 'Click on Login button',
            expectedResult: 'Error message should be displayed',
          },
        ],
      },
    },
  });
  console.log('✅ Test Case created:', testCase2.externalId);

  // Create Requirement Spec first
  const reqSpec = await prisma.requirementSpec.create({
    data: {
      name: 'Authentication Requirements',
      description: 'Requirements for authentication module',
      testProjectId: project1.id,
    },
  });

  // Create Sample Requirements
  const requirement1 = await prisma.requirement.create({
    data: {
      externalId: 'DEMO-REQ-1',
      title: 'User Authentication',
      description: 'System should support user authentication with username and password',
      priority: 'HIGH',
      status: 'APPROVED',
      requirementSpecId: reqSpec.id,
      testProjectId: project1.id,
      createdById: admin.id,
    },
  });
  console.log('✅ Requirement created:', requirement1.externalId);

  // Link Test Cases to Requirements
  await prisma.testCaseRequirement.create({
    data: {
      testCaseId: testCase1.id,
      requirementId: requirement1.id,
    },
  });
  console.log('✅ Linked test cases to requirements');

  // Create Sample Test Plan
  const testPlan = await prisma.testPlan.create({
    data: {
      name: 'Sprint 1 Test Plan',
      description: 'Test plan for Sprint 1 features',
      testProjectId: project1.id,
      testPlanCases: {
        create: [
          {
            testCaseId: testCase1.id,
            orderIndex: 1,
          },
          {
            testCaseId: testCase2.id,
            orderIndex: 2,
          },
        ],
      },
    },
  });
  console.log('✅ Test Plan created:', testPlan.name);

  // Create Test Cycle
  const testCycle = await prisma.testCycle.create({
    data: {
      name: 'Smoke Test Cycle',
      type: 'SMOKE',
      description: 'Smoke testing for critical features',
      status: 'PLANNED',
      testPlanId: testPlan.id,
    },
  });
  console.log('✅ Test Cycle created:', testCycle.name);

  // Create Platform
  const platform = await prisma.platform.create({
    data: {
      name: 'Chrome Browser',
      type: 'BROWSER',
      version: '120.0',
      isActive: true,
      testProjectId: project1.id,
    },
  });
  console.log('✅ Platform created:', platform.name);

  // Create Milestone
  const milestone = await prisma.milestone.create({
    data: {
      name: 'Sprint 1',
      description: 'First sprint milestone',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      status: 'IN_PROGRESS',
      testProjectId: project1.id,
    },
  });
  console.log('✅ Milestone created:', milestone.name);

  console.log('✅ Seeding completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:        admin@testdemo.com / Admin@123');
  console.log('Test Manager: manager@testdemo.com / Manager@123');
  console.log('Tester:       tester@testdemo.com / Tester@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
