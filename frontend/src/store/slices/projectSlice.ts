import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: string;
  name: string;
  prefix: string;
  description?: string;
  isActive: boolean;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setProjects, setCurrentProject, setLoading } = projectSlice.actions;
export default projectSlice.reducer;
