-- CreateEnum
CREATE TYPE "JiraAuthType" AS ENUM ('OAUTH', 'API_TOKEN', 'BASIC');

-- CreateEnum
CREATE TYPE "JiraEntityType" AS ENUM ('TEST_SUITE', 'TEST_CASE', 'TEST_PLAN', 'DEFECT');

-- CreateEnum
CREATE TYPE "JiraSyncStatus" AS ENUM ('SYNCED', 'PENDING', 'FAILED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "JiraSyncDirection" AS ENUM ('TO_JIRA', 'FROM_JIRA', 'BIDIRECTIONAL');

-- CreateTable
CREATE TABLE "jira_integrations" (
    "id" TEXT NOT NULL,
    "testProjectId" TEXT NOT NULL,
    "jiraUrl" TEXT NOT NULL,
    "authType" "JiraAuthType" NOT NULL DEFAULT 'OAUTH',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "apiToken" TEXT,
    "email" TEXT,
    "cloudId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jira_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_projects" (
    "id" TEXT NOT NULL,
    "jiraIntegrationId" TEXT NOT NULL,
    "jiraProjectKey" TEXT NOT NULL,
    "jiraProjectId" TEXT NOT NULL,
    "jiraProjectName" TEXT NOT NULL,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "issueTypeMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jira_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_links" (
    "id" TEXT NOT NULL,
    "jiraIntegrationId" TEXT NOT NULL,
    "jiraProjectId" TEXT NOT NULL,
    "jiraIssueKey" TEXT NOT NULL,
    "jiraIssueId" TEXT NOT NULL,
    "jiraIssueType" TEXT NOT NULL,
    "jiraIssueSummary" TEXT NOT NULL,
    "jiraIssueStatus" TEXT NOT NULL,
    "entityType" "JiraEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "syncStatus" "JiraSyncStatus" NOT NULL DEFAULT 'SYNCED',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncDirection" "JiraSyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jira_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_webhook_events" (
    "id" TEXT NOT NULL,
    "jiraIntegrationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "issueKey" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jira_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jira_integrations_testProjectId_key" ON "jira_integrations"("testProjectId");

-- CreateIndex
CREATE INDEX "jira_integrations_testProjectId_idx" ON "jira_integrations"("testProjectId");

-- CreateIndex
CREATE INDEX "jira_projects_jiraIntegrationId_idx" ON "jira_projects"("jiraIntegrationId");

-- CreateIndex
CREATE UNIQUE INDEX "jira_projects_jiraIntegrationId_jiraProjectKey_key" ON "jira_projects"("jiraIntegrationId", "jiraProjectKey");

-- CreateIndex
CREATE INDEX "jira_links_jiraIntegrationId_idx" ON "jira_links"("jiraIntegrationId");

-- CreateIndex
CREATE INDEX "jira_links_entityType_entityId_idx" ON "jira_links"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "jira_links_jiraIssueKey_idx" ON "jira_links"("jiraIssueKey");

-- CreateIndex
CREATE UNIQUE INDEX "jira_links_jiraIssueKey_entityType_entityId_key" ON "jira_links"("jiraIssueKey", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "jira_webhook_events_jiraIntegrationId_idx" ON "jira_webhook_events"("jiraIntegrationId");

-- CreateIndex
CREATE INDEX "jira_webhook_events_issueKey_idx" ON "jira_webhook_events"("issueKey");

-- CreateIndex
CREATE INDEX "jira_webhook_events_processed_idx" ON "jira_webhook_events"("processed");

-- AddForeignKey
ALTER TABLE "jira_integrations" ADD CONSTRAINT "jira_integrations_testProjectId_fkey" FOREIGN KEY ("testProjectId") REFERENCES "test_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_projects" ADD CONSTRAINT "jira_projects_jiraIntegrationId_fkey" FOREIGN KEY ("jiraIntegrationId") REFERENCES "jira_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_links" ADD CONSTRAINT "jira_links_jiraIntegrationId_fkey" FOREIGN KEY ("jiraIntegrationId") REFERENCES "jira_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jira_links" ADD CONSTRAINT "jira_links_jiraProjectId_fkey" FOREIGN KEY ("jiraProjectId") REFERENCES "jira_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
