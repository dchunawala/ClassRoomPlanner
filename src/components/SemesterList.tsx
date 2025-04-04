import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { Star as StarIcon, StarBorder as StarBorderIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers';
import { useAppContext } from '../context/AppContext';
import dayjs from 'dayjs';

const SemesterList: React.FC = () => {
  const navigate = useNavigate();
  const { semesters, toggleSemesterStar, editSemesterDates } = useAppContext();
  const [editingSemester, setEditingSemester] = useState<any>(null);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [error, setError] = useState<string>('');

  const handleSemesterClick = (id: string) => {
    navigate(`/semester/${id}`);
  };

  const handleStarClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toggleSemesterStar(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update star status');
    }
  };

  const handleEditClick = (e: React.MouseEvent, semester: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSemester(semester);
    setStartDate(dayjs(semester.startDate));
    setEndDate(dayjs(semester.endDate));
    setError('');
  };

  const handleSaveEdit = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (endDate.isBefore(startDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      editSemesterDates(
        editingSemester.id,
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      );
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dates');
    }
  };

  const handleCloseDialog = () => {
    setEditingSemester(null);
    setStartDate(null);
    setEndDate(null);
    setError('');
  };

  const starredSemesters = semesters.filter(sem => sem.isStarred);
  const unstarredSemesters = semesters.filter(sem => !sem.isStarred);

  const renderSemesterList = (semesterList: any[], title: string) => (
    semesterList.length > 0 && (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
        <Paper elevation={1}>
          <List>
            {semesterList.map((semester) => (
              <ListItem
                key={semester.id}
                onClick={() => handleSemesterClick(semester.id)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                  position: 'relative',
                  transition: 'all 0.2s',
                  '&::after': {
                    content: '"Click to view details →"',
                    position: 'absolute',
                    right: '140px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0,
                    color: 'primary.main',
                    transition: 'opacity 0.2s',
                  },
                  '&:hover::after': {
                    opacity: 0.7,
                  },
                }}
              >
                <ListItemText
                  primary={`${semester.name} ${semester.year}`}
                  secondary={`${semester.startDate} to ${semester.endDate}`}
                />
                <Box sx={{ display: 'flex', gap: 1, zIndex: 1 }}>
                  <IconButton
                    onClick={(e) => handleEditClick(e, semester)}
                    title="Edit semester dates"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={(e) => handleStarClick(e, semester.id)}
                    title={semester.isStarred ? 'Remove from starred' : 'Star this semester (max 4)'}
                    size="small"
                    disabled={!semester.isStarred && starredSemesters.length >= 4}
                  >
                    {semester.isStarred ? (
                      <StarIcon color="primary" />
                    ) : (
                      <StarBorderIcon />
                    )}
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    )
  );

  return (
    <>
      {renderSemesterList(starredSemesters, 'Starred Semesters')}
      {renderSemesterList(unstarredSemesters, 'Other Semesters')}

      <Dialog 
        open={!!editingSemester} 
        onClose={handleCloseDialog}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Edit Semester Dates</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Select semester start date'
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Select semester end date'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SemesterList;