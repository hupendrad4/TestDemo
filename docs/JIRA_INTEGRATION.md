# Jira Integration Guide

## Overview

The Qualix Test Management System now includes comprehensive bidirectional integration with Jira, similar to Xray and other enterprise test management tools. This integration allows you to:

- **Link test entities** (Test Cases, Test Suites, Test Plans, Defects) to Jira issues (Stories, Epics, Tasks, Bugs)
- **Bidirectional synchronization** - Changes in either system can sync to the other
- **Real-time updates** via Jira webhooks
- **Automatic defect creation** in Jira when tests fail
- **Test execution status** reflected in Jira issues

## Features

### 1. Entity Linking
- Link Test Cases to Jira Stories/Tasks
- Link Test Suites to Jira Epics
- Link Test Plans to Jira Stories/Epics
- Link Defects to Jira Bugs

### 2. Synchronization Modes
- **To Jira Only**: Push updates from Qualix to Jira
- **From Jira Only**: Pull updates from Jira to Qualix
- **Bidirectional**: Sync in both directions

### 3. Webhook Support
- Real-time updates when Jira issues change
- Automatic sync on issue updates, status changes, deletions

## Setup Instructions

### Step 1: Generate Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a name (e.g., "Qualix Integration")
4. Copy the generated token (you won't see it again!)

### Step 2: Configure Integration in Qualix

1. Navigate to your project in Qualix
2. Go to **Settings** → **Integrations** → **Jira**
3. Fill in the integration form:
   - **Jira URL**: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
   - **Authentication Type**: Select "API Token" (recommended)
   - **Email**: Your Jira account email
   - **API Token**: Paste the token from Step 1

4. Click **Connect to Jira**

### Step 3: Map Jira Projects

1. After successful connection, click **Map Project**
2. Select one or more Jira projects to sync with
3. Configure issue type mapping (optional):
   - Map Jira Epics to Test Suites
   - Map Jira Stories/Tasks to Test Cases
   - Map Jira Bugs to Defects

### Step 4: Link Entities

You can now link entities from Qualix to Jira:

#### Link a Test Case to Jira Story

```typescript
// In Test Case detail page
<JiraLinkComponent
  entityType="TEST_CASE"
  entityId={testCase.id}
  projectId={projectId}
/>
```

1. Click the "Link to Jira" button
2. Search for the Jira issue by key or summary
3. Select the issue from dropdown
4. Click "Link"

#### Link a Test Suite to Jira Epic

```typescript
<JiraLinkComponent
  entityType="TEST_SUITE"
  entityId={testSuite.id}
  projectId={projectId}
/>
```

#### Link a Defect to Jira Bug

```typescript
<JiraLinkComponent
  entityType="DEFECT"
  entityId={defect.id}
  projectId={projectId}
/>
```

## API Endpoints

### Setup Integration
```
POST /api/jira/integration/:testProjectId
Body: {
  jiraUrl: string;
  authType: 'API_TOKEN' | 'OAUTH';
  email?: string;
  apiToken?: string;
  accessToken?: string;
}
```

### Get Integration Settings
```
GET /api/jira/integration/:testProjectId
```

### Toggle Integration
```
PATCH /api/jira/integration/:testProjectId/toggle
Body: { isActive: boolean }
```

### Get Jira Projects
```
GET /api/jira/projects/:testProjectId
```

### Map Jira Project
```
POST /api/jira/projects/:testProjectId/map
Body: {
  jiraProjectKey: string;
  jiraProjectId: string;
  jiraProjectName: string;
}
```

### Search Jira Issues
```
GET /api/jira/search/:testProjectId?jql=<JQL_QUERY>&maxResults=50
```

### Link Entity to Jira
```
POST /api/jira/link/:testProjectId
Body: {
  jiraIssueKey: string;
  entityType: 'TEST_SUITE' | 'TEST_CASE' | 'TEST_PLAN' | 'DEFECT';
  entityId: string;
  jiraProjectId: string;
}
```

### Unlink Entity
```
POST /api/jira/unlink
Body: {
  jiraIssueKey: string;
  entityType: string;
  entityId: string;
}
```

### Get Entity Links
```
GET /api/jira/links/:entityType/:entityId
```

### Sync to Jira
```
POST /api/jira/sync/to-jira
Body: {
  entityType: string;
  entityId: string;
}
```

### Sync from Jira
```
POST /api/jira/sync/from-jira
Body: {
  jiraIssueKey: string;
}
```

### Webhook Endpoint
```
POST /api/jira/webhook/:testProjectId
Body: <Jira Webhook Payload>
```

## Usage Examples

### 1. Adding Jira Links to Test Case Page

```typescript
import React from 'react';
import JiraLinkComponent from '../../components/JiraLinkComponent';

const TestCaseDetail: React.FC = () => {
  const { testCaseId, projectId } = useParams();

  return (
    <Box>
      {/* ...existing test case details... */}
      
      <Divider sx={{ my: 3 }} />
      
      {/* Jira Integration */}
      <JiraLinkComponent
        entityType="TEST_CASE"
        entityId={testCaseId}
        projectId={projectId}
      />
    </Box>
  );
};
```

### 2. Compact View in Table

```typescript
<TableCell>
  <JiraLinkComponent
    entityType="TEST_CASE"
    entityId={row.id}
    projectId={projectId}
    compact={true}  // Shows chips instead of full view
  />
</TableCell>
```

### 3. Programmatic Linking

```typescript
import jiraService from '../../services/jira.service';

// Link test case to Jira story
await jiraService.linkEntity(projectId, {
  jiraIssueKey: 'PROJ-123',
  entityType: 'TEST_CASE',
  entityId: testCase.id,
  jiraProjectId: 'jira-project-id',
});

// Sync changes to Jira
await jiraService.syncToJira('TEST_CASE', testCase.id);
```

## Setting Up Jira Webhooks (Optional for Real-time Sync)

1. In Jira, go to **Settings** → **System** → **WebHooks**
2. Click **Create a WebHook**
3. Configure:
   - **Name**: Qualix Integration
   - **Status**: Enabled
   - **URL**: `https://your-qualix-domain.com/api/jira/webhook/:testProjectId`
   - **Events**: Select the following:
     - Issue: created
     - Issue: updated
     - Issue: deleted
4. Click **Create**

When Jira issues change, Qualix will automatically sync the updates.

## Sync Logic

### From Qualix to Jira (Push)

When you update an entity in Qualix:
1. Check if entity has Jira links
2. For each link with `syncDirection` = `TO_JIRA` or `BIDIRECTIONAL`:
   - Update Jira issue summary with entity name
   - Update Jira issue description with entity description
   - Mark sync status as `SYNCED`

### From Jira to Qualix (Pull)

When a Jira issue is updated (via webhook):
1. Find all entities linked to this issue
2. For each link with `syncDirection` = `FROM_JIRA` or `BIDIRECTIONAL`:
   - Update entity name with Jira issue summary
   - Update entity description with Jira issue description
   - Update link metadata (status, sync time)

## Sync Status Indicators

- 🟢 **SYNCED**: Entity is in sync with Jira
- 🟡 **PENDING**: Sync scheduled but not yet executed
- 🔴 **FAILED**: Sync failed (check error logs)
- ⚠️ **CONFLICT**: Conflicting changes detected (manual resolution needed)

## Troubleshooting

### Connection Failed

**Error**: "Failed to connect to Jira. Please check your credentials."

**Solutions**:
- Verify your Jira URL is correct (should be `https://your-domain.atlassian.net`)
- Ensure API token is valid and not expired
- Check that the email matches your Jira account
- Verify network connectivity to Jira

### Issue Not Found

**Error**: "Jira issue PROJ-123 not found"

**Solutions**:
- Verify the issue key exists in Jira
- Ensure you have permission to view the issue
- Check that the issue is in one of your mapped Jira projects

### Sync Failed

**Error**: "Failed to sync to Jira"

**Solutions**:
- Check that Jira integration is active
- Verify API token hasn't expired
- Ensure you have edit permissions in Jira
- Check network connectivity

### Webhook Not Working

**Solutions**:
- Verify webhook URL is accessible from internet (if Jira Cloud)
- Check webhook secret matches in Jira and Qualix
- Review webhook logs in Jira settings
- Ensure Qualix server can receive external requests

## Database Schema

### JiraIntegration
```prisma
model JiraIntegration {
  id            String   @id @default(uuid())
  testProjectId String   @unique
  jiraUrl       String
  authType      JiraAuthType
  accessToken   String?
  apiToken      String?
  email         String?
  isActive      Boolean
  syncEnabled   Boolean
  lastSyncAt    DateTime?
  createdAt     DateTime
  updatedAt     DateTime
}
```

### JiraProject
```prisma
model JiraProject {
  id                String   @id @default(uuid())
  jiraIntegrationId String
  jiraProjectKey    String
  jiraProjectId     String
  jiraProjectName   String
  syncEnabled       Boolean
  issueTypeMapping  Json?
}
```

### JiraLink
```prisma
model JiraLink {
  id                String   @id @default(uuid())
  jiraIntegrationId String
  jiraProjectId     String
  jiraIssueKey      String
  jiraIssueId       String
  jiraIssueType     String
  jiraIssueSummary  String
  jiraIssueStatus   String
  entityType        JiraEntityType
  entityId          String
  syncStatus        JiraSyncStatus
  syncDirection     JiraSyncDirection
  lastSyncedAt      DateTime
}
```

## Security Considerations

1. **API Tokens**: Never commit API tokens to version control
2. **Environment Variables**: Store tokens in `.env` file
3. **Encryption**: API tokens are stored encrypted in database
4. **Webhook Validation**: Verify webhook signatures to prevent tampering
5. **Permissions**: Respect Jira permissions - users can only link issues they have access to

## Best Practices

1. **Start with one project**: Map one Jira project first to test the integration
2. **Use API Token auth**: More secure than basic auth
3. **Set up webhooks**: For real-time sync instead of polling
4. **Monitor sync status**: Check sync status regularly for failed syncs
5. **Test in staging**: Test integration thoroughly before production use
6. **Document mappings**: Keep track of which test entities are linked to which Jira issues

## Advanced Configuration

### Custom Issue Type Mapping

Map custom Jira issue types to test entities:

```json
{
  "Epic": "TEST_SUITE",
  "Story": "TEST_CASE",
  "Task": "TEST_CASE",
  "Bug": "DEFECT",
  "Test": "TEST_CASE"
}
```

### Conditional Sync

Sync only when certain conditions are met:

```typescript
// Example: Only sync when test case is approved
if (testCase.status === 'APPROVED') {
  await jiraService.syncToJira('TEST_CASE', testCase.id);
}
```

## Future Enhancements

- [ ] Automatic test case creation from Jira stories
- [ ] Bulk linking operations
- [ ] Advanced field mapping (custom fields)
- [ ] Jira JQL editor in UI
- [ ] Sync scheduling (e.g., sync every hour)
- [ ] Conflict resolution UI
- [ ] Jira attachment sync
- [ ] Jira comment sync

## Support

For issues or questions:
- GitHub Issues: [qualix-issues](https://github.com/your-repo/issues)
- Email: support@qualix.com
- Documentation: https://docs.qualix.com/jira-integration
