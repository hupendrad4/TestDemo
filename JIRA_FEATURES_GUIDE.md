# Jira Integration Features - User Guide

## Overview
Your application now has **full bidirectional Jira integration** that allows you to:
- Connect to Jira Cloud/Server
- Link test cases, test plans, test suites, and defects to Jira issues
- Sync data between your application and Jira
- View Jira issue status directly in your test management tool

---

## 🚀 How to Access Jira Integration

### 1. **Settings Page - Jira Configuration**
Navigate to: **Settings → Integrations Tab**

**What you can do here:**
- ✅ Connect your Jira account (API Token or OAuth)
- ✅ Map Jira projects to your test projects
- ✅ Enable/disable sync functionality
- ✅ View integration status

**Steps to Configure:**
1. Go to http://localhost:3002/settings
2. Click on the **"Integrations"** tab
3. Select a project from the dropdown
4. Fill in the Jira connection details:
   - Jira URL (e.g., https://yourcompany.atlassian.net)
   - Email address
   - API Token (generate from: https://id.atlassian.com/manage-profile/security/api-tokens)
5. Click **"Connect to Jira"**
6. Map Jira projects to enable sync

---

### 2. **Test Cases Page - Link to Jira Issues**
Navigate to: **Test Cases** (from sidebar)

**What you'll see:**
- ✅ New **"Jira Links"** column in the test cases table
- ✅ Compact view showing linked Jira issues as chips
- ✅ Quick access to link/unlink issues

**Features:**
- Click on any test case's Jira Links cell to:
  - Link to existing Jira issues (search by JQL)
  - View linked issues with their status
  - Sync test case data to Jira
  - Unlink issues
  - Open issues directly in Jira

---

## 📋 Available Features

### **JiraLinkComponent** (Reusable)
The Jira link component supports the following entity types:
- `TEST_CASE` - Link test cases to Jira Stories/Tasks
- `TEST_SUITE` - Link test suites to Jira Epics
- `TEST_PLAN` - Link test plans to Jira Stories/Epics
- `DEFECT` - Link defects to Jira Bugs

### **Compact View** (in tables)
- Shows linked issues as clickable chips
- Displays issue key and status
- Color-coded status indicators

### **Full View** (in details/drawers)
- Search and link new issues
- View all linked issues with details
- Sync to/from Jira
- Unlink functionality

---

## 🔧 Backend API Endpoints

All Jira integration endpoints are available at: `http://localhost:3005/api/jira`

**Available Endpoints:**
- `POST /api/jira/integration/:projectId` - Setup Jira integration
- `GET /api/jira/integration/:projectId` - Get integration details
- `PUT /api/jira/integration/:projectId/toggle` - Enable/disable integration
- `GET /api/jira/projects/:projectId` - Get Jira projects
- `POST /api/jira/projects/:projectId/map` - Map Jira project
- `GET /api/jira/issues/:projectId/search` - Search Jira issues (JQL)
- `POST /api/jira/link/:projectId` - Link entity to Jira issue
- `DELETE /api/jira/link/:projectId/:linkId` - Unlink entity
- `GET /api/jira/links/:entityType/:entityId` - Get entity's Jira links
- `POST /api/jira/sync/to-jira` - Sync entity to Jira
- `POST /api/jira/sync/from-jira` - Sync from Jira to your app
- `POST /api/jira/webhook/:projectId` - Webhook for real-time updates

**Authentication:** All endpoints (except webhook) require Bearer token authentication.

---

## 📖 Step-by-Step Setup Guide

### **Step 1: Generate Jira API Token**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **"Create API token"**
3. Give it a name (e.g., "TestDemo Integration")
4. Copy the token (save it securely)

### **Step 2: Configure Integration**
1. Open http://localhost:3002/settings
2. Click **"Integrations"** tab
3. Select your project
4. Enter:
   - **Jira URL:** Your Jira instance URL
   - **Email:** Your Atlassian account email
   - **API Token:** The token you generated
5. Click **"Connect to Jira"**

### **Step 3: Map Jira Projects**
1. After successful connection, click **"Load Jira Projects"**
2. Select Jira projects you want to sync with
3. Click **"Map Project"**
4. The mapped projects will appear in the list

### **Step 4: Link Test Cases**
1. Go to **Test Cases** page
2. Look at the **"Jira Links"** column
3. Click on the cell for any test case
4. Search for Jira issues using:
   - Issue key (e.g., PROJ-123)
   - Text search (searches summary and description)
5. Select an issue and click **"Link"**
6. The Jira issue will now appear as a chip in the table

### **Step 5: Sync Data**
- Click the sync icon (🔄) to push test case updates to Jira
- Data synced includes: summary, description, status, priority
- Jira issue status updates reflect in your app automatically

---

## 🎯 Next Steps - Additional Integration Points

To add Jira linking to other pages:

### **Test Plans Page:**
Add to the test plan details view:
```tsx
<JiraLinkComponent
  entityType="TEST_PLAN"
  entityId={testPlan.id}
  projectId={testPlan.testProjectId}
/>
```

### **Test Suites Page:**
```tsx
<JiraLinkComponent
  entityType="TEST_SUITE"
  entityId={testSuite.id}
  projectId={testSuite.testProjectId}
/>
```

### **Defects Page:**
```tsx
<JiraLinkComponent
  entityType="DEFECT"
  entityId={defect.id}
  projectId={defect.testProjectId}
/>
```

---

## 🔍 Troubleshooting

### **Issue: Cannot see Integrations tab**
- **Solution:** Make sure you're logged in and on the Settings page (/settings)

### **Issue: "Please select a project" message**
- **Solution:** Select a project from the dropdown in the Integrations tab

### **Issue: Connection fails**
- Check Jira URL format (should be https://yourcompany.atlassian.net)
- Verify API token is correct and not expired
- Ensure email matches your Atlassian account

### **Issue: Cannot see Jira Links column**
- **Solution:** Refresh the page after deployment
- The column should appear after "Status" column

### **Issue: Sync not working**
- Verify Jira integration is enabled (toggle in Settings)
- Check that the Jira project is mapped
- Ensure the linked issue still exists in Jira

---

## 📚 Technical Documentation

For detailed API documentation and developer guide, see:
- `/docs/JIRA_INTEGRATION.md` - Complete technical documentation
- Database schema: Check `prisma/schema.prisma` for Jira models

---

## ✅ Summary

**Your Jira integration is now fully functional!**

**Access Points:**
1. ⚙️ **Settings → Integrations** - Configure Jira connection
2. 📝 **Test Cases Page** - See "Jira Links" column in table
3. 🔗 **API Endpoints** - Full REST API available at `/api/jira/*`

**Ready to Use:**
- ✅ Jira connection and authentication
- ✅ Project mapping
- ✅ Test case linking (visible in table)
- ✅ Bidirectional sync
- ✅ Real-time status updates

**Test it now:** http://localhost:3002
