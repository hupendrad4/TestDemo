-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEST_MANAGER', 'TESTER', 'DEVELOPER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TestCaseStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ExecutionType" AS ENUM ('MANUAL', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "TestCaseFormat" AS ENUM ('TRADITIONAL', 'BDD');

-- CreateEnum
CREATE TYPE "TestCycleType" AS ENUM ('SMOKE', 'SANITY', 'REGRESSION', 'INTEGRATION', 'SYSTEM', 'UAT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PASSED', 'FAILED', 'BLOCKED', 'NOT_RUN', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReqStatus" AS ENUM ('DRAFT', 'APPROVED', 'IMPLEMENTED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "DefectStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'BLOCKER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'RADIO');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('JIRA', 'AZURE_DEVOPS', 'GITHUB', 'GITLAB');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('OS', 'BROWSER', 'DEVICE', 'ENVIRONMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('DEV', 'QA', 'STAGING', 'UAT', 'PRODUCTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('TEST_CASE', 'TEST_SUITE', 'TEST_PLAN', 'TEST_RUN', 'REQUIREMENT', 'DEFECT', 'EXECUTION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MENTION', 'ASSIGNMENT', 'EXECUTION_FAILED', 'EXECUTION_PASSED', 'COMMENT', 'STATUS_CHANGE', 'DEADLINE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('EXECUTION_SUMMARY', 'REQUIREMENT_COVERAGE', 'PLATFORM_BREAKDOWN', 'TREND_ANALYSIS', 'FLAKY_TESTS', 'AUTOMATION_PROGRESS', 'DEFECT_ANALYSIS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AISuggestionType" AS ENUM ('TEST_GENERATION', 'TEST_IMPROVEMENT', 'MISSING_COVERAGE', 'DUPLICATE_DETECTION', 'FLAKY_TEST_FIX');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'MERGED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "BranchAction" AS ENUM ('ADDED', 'MODIFIED', 'DELETED');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('SCENARIO', 'SCENARIO_OUTLINE', 'BACKGROUND');

-- CreateEnum
CREATE TYPE "StepKeyword" AS ENUM ('GIVEN', 'WHEN', 'THEN', 'AND', 'BUT');

-- CreateEnum
CREATE TYPE "CICDProvider" AS ENUM ('JENKINS', 'GITHUB_ACTIONS', 'GITLAB_CI', 'CIRCLE_CI', 'AZURE_DEVOPS', 'BAMBOO', 'TEAMCITY', 'BITBUCKET', 'TRAVIS_CI', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CICDRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILURE', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "IntegrationTypeExt" AS ENUM ('JIRA', 'AZURE_DEVOPS', 'GITHUB', 'GITLAB', 'CONFLUENCE', 'SLACK', 'MS_TEAMS', 'EMAIL', 'CLICKUP', 'LINEAR', 'YOUTRACK', 'SHORTCUT', 'PLAYWRIGHT', 'CYPRESS', 'SELENIUM', 'PYTEST', 'JEST', 'CUCUMBER', 'TESTCAFE', 'CODECEPT');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('MANUAL', 'SCHEDULED', 'WEBHOOK', 'API');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "DataFormat" AS ENUM ('JSON', 'CSV', 'XML', 'YAML');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_suites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "testProjectId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_suites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "preconditions" TEXT,
    "testSuiteId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "TestCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "executionType" "ExecutionType" NOT NULL DEFAULT 'MANUAL',
    "estimatedTime" INTEGER,
    "format" "TestCaseFormat" NOT NULL DEFAULT 'TRADITIONAL',
    "gherkinScenario" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_steps" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "testData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_keywords" (
    "testCaseId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,

    CONSTRAINT "test_case_keywords_pkey" PRIMARY KEY ("testCaseId","keywordId")
);

-- CreateTable
CREATE TABLE "test_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testProjectId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testPlanId" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TestCycleType" NOT NULL,
    "description" TEXT,
    "testPlanId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "CycleStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plan_cases" (
    "id" TEXT NOT NULL,
    "testPlanId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_plan_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plan_assignments" (
    "id" TEXT NOT NULL,
    "testPlanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_executions" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "testCycleId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "environmentId" TEXT,
    "status" "ExecutionStatus" NOT NULL,
    "executionTime" INTEGER,
    "notes" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_step_executions" (
    "id" TEXT NOT NULL,
    "testExecutionId" TEXT NOT NULL,
    "testStepId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "actualResult" TEXT,
    "notes" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_step_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_specs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testProjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirementSpecId" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "ReqStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_requirements" (
    "testCaseId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_case_requirements_pkey" PRIMARY KEY ("testCaseId","requirementId")
);

-- CreateTable
CREATE TABLE "defects" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "DefectStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "environment" TEXT,
    "stepsToReproduce" TEXT,
    "expectedBehavior" TEXT,
    "actualBehavior" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defect_executions" (
    "defectId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defect_executions_pkey" PRIMARY KEY ("defectId","executionId")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "possibleValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "defectId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "testCaseId" TEXT,
    "executionId" TEXT,
    "defectId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_steps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testProjectId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "testData" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_step_links" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "sharedStepId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_step_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlatformType" NOT NULL,
    "version" TEXT,
    "testProjectId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testProjectId" TEXT NOT NULL,
    "url" TEXT,
    "type" "EnvironmentType" NOT NULL DEFAULT 'QA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testProjectId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plan_milestones" (
    "testPlanId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_plan_milestones_pkey" PRIMARY KEY ("testPlanId","milestoneId")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testPlanId" TEXT NOT NULL,
    "testCycleId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "platformId" TEXT,
    "environmentId" TEXT,
    "assignedToId" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_run_results" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "executionId" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'NOT_RUN',
    "executedById" TEXT,
    "executedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_run_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_views" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "EntityType" NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" JSONB,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "testRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" "EntityType",
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReportType" NOT NULL,
    "config" JSONB NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "reportTemplateId" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "testProjectId" TEXT NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookSubscriptionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_test_suggestions" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT,
    "testCaseId" TEXT,
    "testProjectId" TEXT NOT NULL,
    "suggestionType" "AISuggestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "generatedSteps" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_test_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flaky_test_detections" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "detectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flakinessScore" DOUBLE PRECISION NOT NULL,
    "consecutiveFails" INTEGER NOT NULL DEFAULT 0,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "passedAfterFail" INTEGER NOT NULL DEFAULT 0,
    "isFlaky" BOOLEAN NOT NULL DEFAULT false,
    "autoTagged" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flaky_test_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_coverage" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "testSuiteId" TEXT,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "automatedTests" INTEGER NOT NULL DEFAULT 0,
    "manualTests" INTEGER NOT NULL DEFAULT 0,
    "coveragePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_versions" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "preconditions" TEXT,
    "steps" JSONB NOT NULL,
    "status" "TestCaseStatus" NOT NULL,
    "createdById" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_case_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_branches" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceBranch" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "mergedAt" TIMESTAMP(3),
    "mergedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_branches" (
    "id" TEXT NOT NULL,
    "testBranchId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "action" "BranchAction" NOT NULL,
    "previousVersion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_case_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gherkin_features" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gherkin_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gherkin_scenarios" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ScenarioType" NOT NULL DEFAULT 'SCENARIO',
    "tags" TEXT[],
    "background" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gherkin_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gherkin_steps" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "keyword" "StepKeyword" NOT NULL,
    "text" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "docString" TEXT,
    "dataTable" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gherkin_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cicd_pipelines" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "CICDProvider" NOT NULL,
    "pipelineUrl" TEXT,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cicd_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cicd_runs" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "runNumber" INTEGER NOT NULL,
    "status" "CICDRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "triggeredBy" TEXT,
    "commitHash" TEXT,
    "branchName" TEXT,
    "logs" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cicd_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cicd_test_results" (
    "id" TEXT NOT NULL,
    "cicdRunId" TEXT NOT NULL,
    "testCaseId" TEXT,
    "testName" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "stackTrace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cicd_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations_extended" (
    "id" TEXT NOT NULL,
    "type" "IntegrationTypeExt" NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncFrequency" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_extended_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sync_logs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncType" "SyncType" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_execution_archives" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "executionData" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "test_execution_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_report_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_report_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_metrics" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "failedTests" INTEGER NOT NULL DEFAULT 0,
    "blockedTests" INTEGER NOT NULL DEFAULT 0,
    "skippedTests" INTEGER NOT NULL DEFAULT 0,
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgExecutionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flakyTests" INTEGER NOT NULL DEFAULT 0,
    "totalDefects" INTEGER NOT NULL DEFAULT 0,
    "openDefects" INTEGER NOT NULL DEFAULT 0,
    "automationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requirementCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "prompt" TEXT,
    "summary" TEXT NOT NULL,
    "insights" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT NOT NULL,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_data_sets" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" "DataFormat" NOT NULL DEFAULT 'JSON',
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_data_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_data_sets" (
    "testCaseId" TEXT NOT NULL,
    "dataSetId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_case_data_sets_pkey" PRIMARY KEY ("testCaseId","dataSetId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "test_projects_prefix_key" ON "test_projects"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "test_cases_testSuiteId_externalId_key" ON "test_cases"("testSuiteId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "test_steps_testCaseId_stepNumber_key" ON "test_steps"("testCaseId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_name_key" ON "keywords"("name");

-- CreateIndex
CREATE UNIQUE INDEX "test_plan_cases_testPlanId_testCaseId_key" ON "test_plan_cases"("testPlanId", "testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "test_plan_assignments_testPlanId_userId_key" ON "test_plan_assignments"("testPlanId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_testProjectId_externalId_key" ON "requirements"("testProjectId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "defects_externalId_key" ON "defects"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_testProjectId_name_key" ON "custom_fields"("testProjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_customFieldId_testCaseId_key" ON "custom_field_values"("customFieldId", "testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_testProjectId_type_key" ON "integrations"("testProjectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_testProjectId_userId_key" ON "project_members"("testProjectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_step_links_testCaseId_sharedStepId_orderIndex_key" ON "shared_step_links"("testCaseId", "sharedStepId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_testProjectId_name_type_key" ON "platforms"("testProjectId", "name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "environments_testProjectId_name_key" ON "environments"("testProjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "test_run_results_testRunId_testCaseId_key" ON "test_run_results"("testRunId", "testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_entries_userId_entityType_entityId_key" ON "watchlist_entries"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "ai_test_suggestions_testProjectId_idx" ON "ai_test_suggestions"("testProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "flaky_test_detections_testCaseId_key" ON "flaky_test_detections"("testCaseId");

-- CreateIndex
CREATE INDEX "automation_coverage_testProjectId_idx" ON "automation_coverage"("testProjectId");

-- CreateIndex
CREATE INDEX "automation_coverage_testSuiteId_idx" ON "automation_coverage"("testSuiteId");

-- CreateIndex
CREATE INDEX "test_case_versions_testCaseId_idx" ON "test_case_versions"("testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "test_case_versions_testCaseId_version_key" ON "test_case_versions"("testCaseId", "version");

-- CreateIndex
CREATE INDEX "test_branches_testProjectId_idx" ON "test_branches"("testProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "test_branches_testProjectId_name_key" ON "test_branches"("testProjectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "test_case_branches_testBranchId_testCaseId_key" ON "test_case_branches"("testBranchId", "testCaseId");

-- CreateIndex
CREATE INDEX "gherkin_features_testProjectId_idx" ON "gherkin_features"("testProjectId");

-- CreateIndex
CREATE INDEX "gherkin_scenarios_featureId_idx" ON "gherkin_scenarios"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "gherkin_steps_scenarioId_stepNumber_key" ON "gherkin_steps"("scenarioId", "stepNumber");

-- CreateIndex
CREATE INDEX "cicd_pipelines_testProjectId_idx" ON "cicd_pipelines"("testProjectId");

-- CreateIndex
CREATE INDEX "cicd_runs_pipelineId_idx" ON "cicd_runs"("pipelineId");

-- CreateIndex
CREATE INDEX "cicd_test_results_cicdRunId_idx" ON "cicd_test_results"("cicdRunId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_extended_testProjectId_type_key" ON "integrations_extended"("testProjectId", "type");

-- CreateIndex
CREATE INDEX "integration_sync_logs_integrationId_idx" ON "integration_sync_logs"("integrationId");

-- CreateIndex
CREATE INDEX "test_execution_archives_testProjectId_idx" ON "test_execution_archives"("testProjectId");

-- CreateIndex
CREATE INDEX "test_execution_archives_archivedAt_idx" ON "test_execution_archives"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_report_links_token_key" ON "public_report_links"("token");

-- CreateIndex
CREATE INDEX "public_report_links_token_idx" ON "public_report_links"("token");

-- CreateIndex
CREATE INDEX "public_report_links_testRunId_idx" ON "public_report_links"("testRunId");

-- CreateIndex
CREATE INDEX "test_metrics_testProjectId_date_idx" ON "test_metrics"("testProjectId", "date");

-- CreateIndex
CREATE INDEX "ai_reports_testProjectId_idx" ON "ai_reports"("testProjectId");

-- CreateIndex
CREATE INDEX "test_data_sets_testProjectId_idx" ON "test_data_sets"("testProjectId");

-- AddForeignKey
ALTER TABLE "test_projects" ADD CONSTRAINT "test_projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_testSuiteId_fkey" FOREIGN KEY ("testSuiteId") REFERENCES "test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_keywords" ADD CONSTRAINT "test_case_keywords_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_keywords" ADD CONSTRAINT "test_case_keywords_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cycles" ADD CONSTRAINT "test_cycles_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_cases" ADD CONSTRAINT "test_plan_cases_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_cases" ADD CONSTRAINT "test_plan_cases_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_assignments" ADD CONSTRAINT "test_plan_assignments_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_assignments" ADD CONSTRAINT "test_plan_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_testCycleId_fkey" FOREIGN KEY ("testCycleId") REFERENCES "test_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_executions" ADD CONSTRAINT "test_executions_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_step_executions" ADD CONSTRAINT "test_step_executions_testExecutionId_fkey" FOREIGN KEY ("testExecutionId") REFERENCES "test_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_step_executions" ADD CONSTRAINT "test_step_executions_testStepId_fkey" FOREIGN KEY ("testStepId") REFERENCES "test_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_specs" ADD CONSTRAINT "requirement_specs_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_requirementSpecId_fkey" FOREIGN KEY ("requirementSpecId") REFERENCES "requirement_specs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_requirements" ADD CONSTRAINT "test_case_requirements_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_requirements" ADD CONSTRAINT "test_case_requirements_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defects" ADD CONSTRAINT "defects_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_executions" ADD CONSTRAINT "defect_executions_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "defects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_executions" ADD CONSTRAINT "defect_executions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "test_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "defects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "test_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "defects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_steps" ADD CONSTRAINT "shared_steps_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_steps" ADD CONSTRAINT "shared_steps_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_step_links" ADD CONSTRAINT "shared_step_links_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_step_links" ADD CONSTRAINT "shared_step_links_sharedStepId_fkey" FOREIGN KEY ("sharedStepId") REFERENCES "shared_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platforms" ADD CONSTRAINT "platforms_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_milestones" ADD CONSTRAINT "test_plan_milestones_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_milestones" ADD CONSTRAINT "test_plan_milestones_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_testPlanId_fkey" FOREIGN KEY ("testPlanId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_testCycleId_fkey" FOREIGN KEY ("testCycleId") REFERENCES "test_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "test_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_entries" ADD CONSTRAINT "watchlist_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_entries" ADD CONSTRAINT "watchlist_entries_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_reportTemplateId_fkey" FOREIGN KEY ("reportTemplateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookSubscriptionId_fkey" FOREIGN KEY ("webhookSubscriptionId") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_test_suggestions" ADD CONSTRAINT "ai_test_suggestions_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flaky_test_detections" ADD CONSTRAINT "flaky_test_detections_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_versions" ADD CONSTRAINT "test_case_versions_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_branches" ADD CONSTRAINT "test_case_branches_testBranchId_fkey" FOREIGN KEY ("testBranchId") REFERENCES "test_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_branches" ADD CONSTRAINT "test_case_branches_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gherkin_scenarios" ADD CONSTRAINT "gherkin_scenarios_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "gherkin_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gherkin_steps" ADD CONSTRAINT "gherkin_steps_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "gherkin_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cicd_runs" ADD CONSTRAINT "cicd_runs_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "cicd_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cicd_test_results" ADD CONSTRAINT "cicd_test_results_cicdRunId_fkey" FOREIGN KEY ("cicdRunId") REFERENCES "cicd_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sync_logs" ADD CONSTRAINT "integration_sync_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations_extended"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_report_links" ADD CONSTRAINT "public_report_links_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_report_links" ADD CONSTRAINT "public_report_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_data_sets" ADD CONSTRAINT "test_case_data_sets_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_data_sets" ADD CONSTRAINT "test_case_data_sets_dataSetId_fkey" FOREIGN KEY ("dataSetId") REFERENCES "test_data_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
