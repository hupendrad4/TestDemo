import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as TestCaseIcon,
  FolderOpen as SuiteIcon,
  Assignment as RequirementIcon,
  PlaylistAddCheck as PlanIcon,
  BugReport as DefectIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SearchService, { SearchResults } from '../../services/search.service';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose, projectId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length >= 2) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await SearchService.globalSearch(query, projectId);
          setResults(data);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setResults(null);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, projectId]);

  const handleItemClick = (type: string, id: string) => {
    onClose();
    setQuery('');
    
    switch (type) {
      case 'testCase':
        navigate(`/test-cases/${id}`);
        break;
      case 'testSuite':
        navigate(`/test-suites/${id}`);
        break;
      case 'requirement':
        navigate(`/requirements/${id}`);
        break;
      case 'testPlan':
        navigate(`/test-plans/${id}`);
        break;
      case 'testRun':
        navigate(`/test-runs/${id}`);
        break;
      case 'defect':
        navigate(`/defects/${id}`);
        break;
    }
  };

  const renderSection = (title: string, items: any[], icon: React.ReactNode, type: string, idField: string = 'id', nameField: string = 'name') => {
    if (!items || items.length === 0) return null;

    return (
      <Box key={title}>
        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 600 }}>
          {title} ({items.length})
        </Typography>
        <List dense>
          {items.map((item) => (
            <ListItem
              key={item[idField]}
              button
              onClick={() => handleItemClick(type, item[idField])}
              sx={{ '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={item[nameField] || item.title}
                secondary={item.externalId || item.description?.substring(0, 60)}
              />
              {item.status && (
                <Chip label={item.status} size="small" />
              )}
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px', maxHeight: '80vh' }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          autoFocus
          placeholder="Search test cases, requirements, plans, defects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton size="small" onClick={() => setQuery('')}>
                    <CloseIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {!query && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              Start typing to search across test cases, requirements, plans, and more...
            </Typography>
          </Box>
        )}

        {query && !loading && !results && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Type at least 2 characters to search
            </Typography>
          </Box>
        )}

        {results && (
          <>
            {renderSection('Test Cases', results.testCases, <TestCaseIcon />, 'testCase', 'id', 'name')}
            {renderSection('Test Suites', results.testSuites, <SuiteIcon />, 'testSuite', 'id', 'name')}
            {renderSection('Requirements', results.requirements, <RequirementIcon />, 'requirement', 'id', 'title')}
            {renderSection('Test Plans', results.testPlans, <PlanIcon />, 'testPlan', 'id', 'name')}
            {renderSection('Test Runs', results.testRuns, <PlanIcon />, 'testRun', 'id', 'name')}
            {renderSection('Defects', results.defects, <DefectIcon />, 'defect', 'id', 'title')}

            {Object.values(results).every(arr => arr.length === 0) && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No results found for "{query}"
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
