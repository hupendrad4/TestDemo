import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TestCase {
  id: string;
  externalId: string;
  name: string;
  summary?: string;
  status: string;
  priority: string;
}

interface TestCaseState {
  testCases: TestCase[];
  currentTestCase: TestCase | null;
  loading: boolean;
}

const initialState: TestCaseState = {
  testCases: [],
  currentTestCase: null,
  loading: false,
};

const testCaseSlice = createSlice({
  name: 'testCases',
  initialState,
  reducers: {
    setTestCases: (state, action: PayloadAction<TestCase[]>) => {
      state.testCases = action.payload;
    },
    setCurrentTestCase: (state, action: PayloadAction<TestCase | null>) => {
      state.currentTestCase = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setTestCases, setCurrentTestCase, setLoading } = testCaseSlice.actions;
export default testCaseSlice.reducer;
