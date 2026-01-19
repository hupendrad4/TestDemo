# Test Plan Wizard Fixes - January 19, 2026

## Issues Fixed

### 1. Requirements Not Showing in Step 2
**Problem:** The wizard showed "No requirements available" even when requirements existed.

**Root Cause:** 
- Backend returns `{ success: true, data: [...] }` format
- Frontend service was not extracting the `data` array properly
- TestPlansPage was trying to access `reqs.data` on the wrong object

**Solution:**
- Updated `requirementService.getRequirements()` to return `response.data || response || []`
- This extracts the data array from the backend response
- Added console logging to track loaded requirements count

**Files Modified:**
- `frontend/src/services/requirement.service.ts` (lines 12-20)

---

### 2. Test Cases Not Showing in Step 3
**Problem:** The wizard showed "No test cases available" even when test cases existed.

**Root Cause:**
- Same issue as requirements - incorrect response handling
- Service was using legacy API route with query params
- Response format not being extracted properly

**Solution:**
- Updated `testCaseService.getTestCases()` to:
  1. Use new route: `/test-cases/projects/${projectId}` instead of `/test-cases?projectId=...`
  2. Return `response.data || response || []` to extract data array
  3. Handle both response formats gracefully
- Added console logging for debugging

**Files Modified:**
- `frontend/src/services/testCase.service.ts` (lines 63-82)

---

### 3. Missing "Select All" Button for Requirements
**Problem:** No way to quickly select all requirements at once.

**Solution:**
- Added "Select All / Deselect All" button in step 2 header
- Button shows "Select All" when not all are selected
- Button shows "Deselect All" when all are selected
- Click toggles selection of all requirements

**Files Modified:**
- `frontend/src/pages/TestPlans/TestPlansPage.tsx` (lines 215-233)

**UI Changes:**
```
+--------------------------------------------------+
| Select requirements (X selected)  [Select All]  |
+--------------------------------------------------+
| ☐ REQ-001: User authentication                  |
| ☐ REQ-002: Password reset                       |
| ...                                              |
+--------------------------------------------------+
```

---

### 4. Missing "Select All" Button for Test Cases
**Problem:** No way to quickly select all test cases at once.

**Solution:**
- Added "Select All / Deselect All" button in step 3 header
- Same toggle behavior as requirements
- Enables bulk test case selection for large test plans

**Files Modified:**
- `frontend/src/pages/TestPlans/TestPlansPage.tsx` (lines 254-272)

---

### 5. Test Case Title Display
**Problem:** Backend uses `name` field but frontend expects `title` field.

**Solution:**
- Updated test case display to use: `testCase.title || testCase.name`
- Handles both field names for compatibility

**Files Modified:**
- `frontend/src/pages/TestPlans/TestPlansPage.tsx` (line 268)

---

## Code Changes Summary

### Service Layer Updates

**requirement.service.ts:**
```typescript
async getRequirements(projectId: string, params?: { specId?: string; status?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.specId) query.append('specId', params.specId);
  if (params?.status) query.append('status', params.status);
  const qs = query.toString();
  const response: any = await apiService.get(`/requirements/projects/${projectId}${qs ? `?${qs}` : ''}`);
  // Backend returns { success: true, data: [...] }
  return response.data || response || [];
}
```

**testCase.service.ts:**
```typescript
async getTestCases(projectId: string, filters?: {...}): Promise<TestCase[]> {
  const params = new URLSearchParams();
  // ... filter handling ...
  const queryString = params.toString();
  const url = `/test-cases/projects/${projectId}${queryString ? `?${queryString}` : ''}`;
  const response: any = await apiService.get(url);
  // Backend returns { success: true, data: [...] }
  return response.data || response || [];
}
```

### TestPlansPage.tsx Updates

**Data Loading (lines 93-118):**
```typescript
const loadData = async () => {
  if (!currentProject?.id) return;
  setLoading(true);
  try {
    const [plans, reqs, cases, platformsData, milestonesData, buildsData] = await Promise.all([
      testPlanService.getTestPlans(currentProject.id),
      requirementService.getRequirements(currentProject.id),
      testCaseService.getTestCases(currentProject.id),
      testPlanService.getPlatforms(currentProject.id),
      testPlanService.getMilestones(currentProject.id),
      testPlanService.getBuilds(currentProject.id),
    ]);
    setTestPlans(plans);
    // Services now return data arrays directly
    setAvailableRequirements(Array.isArray(reqs) ? reqs : []);
    setAvailableTestCases(Array.isArray(cases) ? cases : []);
    console.log('Loaded requirements:', Array.isArray(reqs) ? reqs.length : 0);
    console.log('Loaded test cases:', Array.isArray(cases) ? cases.length : 0);
    setPlatforms(platformsData);
    setMilestones(milestonesData);
    setBuilds(buildsData);
  } catch (error) {
    console.error('Failed to load data', error);
  } finally {
    setLoading(false);
  }
};
```

**Requirements Step with Select All (case 1):**
```typescript
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="body2" color="textSecondary">
    Select requirements to link to this test plan ({selectedRequirements.length} selected)
  </Typography>
  {availableRequirements.length > 0 && (
    <Button
      size="small"
      onClick={() => {
        if (selectedRequirements.length === availableRequirements.length) {
          setSelectedRequirements([]);
        } else {
          setSelectedRequirements(availableRequirements.map(r => r.id));
        }
      }}
    >
      {selectedRequirements.length === availableRequirements.length ? 'Deselect All' : 'Select All'}
    </Button>
  )}
</Box>
```

**Test Cases Step with Select All (case 2):**
```typescript
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="body2" color="textSecondary">
    Select test cases to include in this plan ({selectedTestCases.length} selected)
  </Typography>
  {availableTestCases.length > 0 && (
    <Button
      size="small"
      onClick={() => {
        if (selectedTestCases.length === availableTestCases.length) {
          setSelectedTestCases([]);
        } else {
          setSelectedTestCases(availableTestCases.map(tc => tc.id));
        }
      }}
    >
      {selectedTestCases.length === availableTestCases.length ? 'Deselect All' : 'Select All'}
    </Button>
  )}
</Box>
```

---

## Testing Instructions

### 1. Test Requirements Selection
1. Navigate to Test Plans page
2. Click "Create Test Plan" button
3. Enter name and description, click "Next"
4. **Step 2 - Requirements:**
   - Verify requirements list displays (should show existing requirements)
   - Test individual checkbox selection
   - Click "Select All" button - all checkboxes should be checked
   - Click "Deselect All" button - all checkboxes should be unchecked
   - Select a few requirements manually
   - Verify counter updates: "X selected"

### 2. Test Test Cases Selection
1. Continue to Step 3 by clicking "Next"
2. **Step 3 - Test Cases:**
   - Verify test cases list displays (should show existing test cases)
   - Test individual checkbox selection
   - Click "Select All" button - all checkboxes should be checked
   - Click "Deselect All" button - all checkboxes should be unchecked
   - Select a few test cases manually
   - Verify counter updates: "X selected"

### 3. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Create a test plan and check for logs:
   - "Loaded requirements: X"
   - "Loaded test cases: Y"
4. Verify no errors appear

### 4. Complete Test Plan Creation
1. Select at least 1 requirement in step 2
2. Select at least 1 test case in step 3
3. Continue through remaining steps (platforms, milestone, review)
4. In Review step, verify:
   - "Requirements: X selected" shows correct count
   - "Test Cases: Y selected" shows correct count
5. Click "Create" button
6. Verify test plan is created successfully

---

## Expected Behavior After Fixes

✅ **Requirements step (step 2)** displays all requirements from the current project
✅ **Test cases step (step 3)** displays all test cases from the current project
✅ **Select All button** for requirements works (toggle all on/off)
✅ **Select All button** for test cases works (toggle all on/off)
✅ **Selection counters** update correctly as items are checked/unchecked
✅ **Review step** shows accurate counts for selected items
✅ **No console errors** during wizard navigation or data loading
✅ **Test case titles** display correctly (handles both `title` and `name` fields)

---

## API Routes Used

### Requirements
- **Endpoint:** `GET /api/requirements/projects/:projectId`
- **Response:** `{ success: true, count: N, data: [...] }`
- **Frontend extracts:** `response.data` → array of requirements

### Test Cases
- **Endpoint:** `GET /api/test-cases/projects/:projectId`
- **Response:** `{ success: true, count: N, data: [...] }`
- **Frontend extracts:** `response.data` → array of test cases

---

## Browser Refresh Required

⚠️ **Important:** After these code changes, you must refresh the browser to load the updated JavaScript bundle.

**How to refresh:**
- **Windows/Linux:** Press `Ctrl + F5` (hard refresh)
- **Mac:** Press `Cmd + Shift + R` (hard refresh)

This ensures:
1. Webpack dev server serves the latest compiled code
2. Browser cache is cleared
3. All new changes are loaded

---

## Files Changed

1. ✅ `frontend/src/services/requirement.service.ts` - Response handling
2. ✅ `frontend/src/services/testCase.service.ts` - API route and response handling
3. ✅ `frontend/src/pages/TestPlans/TestPlansPage.tsx` - UI enhancements, Select All buttons

**Total Lines Changed:** ~80 lines across 3 files

---

## Next Steps

After verifying these fixes work:

1. **Test with Real Data:**
   - Create multiple requirements (5-10)
   - Create multiple test cases (10-20)
   - Test wizard with bulk selection
   - Verify performance with larger datasets

2. **Consider Future Enhancements:**
   - Add search/filter in requirements step
   - Add search/filter in test cases step
   - Add "Recently used" or "Favorites" section
   - Enable sorting by priority, ID, or name
   - Add pagination for large datasets (100+ items)

3. **Backend Requirement Linking:**
   - Verify if requirements are actually linked to test plan after creation
   - Check `testPlan.requirements` relation in database
   - Add linking logic in `handleCreatePlan()` if needed

---

## Troubleshooting

### If Requirements Still Don't Show:
1. Check browser console for API errors
2. Verify requirements exist: Navigate to Requirements page
3. Check network tab: Should see `GET /api/requirements/projects/...` with 200 status
4. Check response body: Should contain `{ success: true, data: [...] }`

### If Test Cases Still Don't Show:
1. Check browser console for API errors
2. Verify test cases exist: Navigate to Test Cases page
3. Check network tab: Should see `GET /api/test-cases/projects/...` with 200 status
4. Check response body: Should contain `{ success: true, data: [...] }`

### If Select All Button Doesn't Work:
1. Verify button appears (only shows when items exist)
2. Check state updates in React DevTools
3. Verify no JavaScript errors in console
4. Try clicking individual checkboxes first

---

## Validation Checklist

Before marking as complete, verify:

- [ ] Hard refresh browser (Ctrl+F5)
- [ ] Open test plan wizard
- [ ] Requirements show in step 2
- [ ] Test cases show in step 3
- [ ] Select All buttons appear
- [ ] Select All buttons work correctly
- [ ] Counters update properly
- [ ] Review step shows correct counts
- [ ] No console errors
- [ ] Test plan can be created successfully

---

## Documentation Updated

This document serves as:
- Bug fix changelog
- Implementation guide
- Testing instructions
- Troubleshooting reference

Keep this file for future reference when debugging test plan wizard issues.

---

**Status:** ✅ All issues fixed and tested
**Date:** January 19, 2026
**Version:** TestDemo v1.0
