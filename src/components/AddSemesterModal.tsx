import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Box,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useAppContext } from '../context/AppContext';
import dayjs from 'dayjs';

interface AddSemesterModalProps {
  open: boolean;
  onClose: () => void;
}

const AddSemesterModal: React.FC<AddSemesterModalProps> = ({ open, onClose }) => {
  const { addSemester, semesters } = useAppContext();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [sourceSemesterId, setSourceSemesterId] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const handleSubmit = async () => {
    try {
      if (!name || !year) {
        setError('Please fill in all fields');
        return;
      }

      if (isCloning && !sourceSemesterId) {
        setError('Please select a source semester to clone from');
        return;
      }

      await addSemester(
        name, 
        parseInt(year), 
        isCloning ? sourceSemesterId : undefined
      );
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create semester');
    }
  };

  const handleClose = () => {
    setName('');
    setYear('');
    setError('');
    setIsCloning(false);
    setSourceSemesterId('');
    setStartDate(null);
    setEndDate(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      sx={{ 
        '& .MuiDialog-paper': { 
          minWidth: '500px',
          maxHeight: '90vh'
        } 
      }}
    >
      <DialogTitle>Add New Semester</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isCloning}
                onChange={(e) => {
                  setIsCloning(e.target.checked);
                  if (!e.target.checked) {
                    setSourceSemesterId('');
                  }
                }}
              />
            }
            label="Clone from existing semester"
          />

          {isCloning && (
            <>
              <TextField
                select
                label="Source Semester"
                value={sourceSemesterId}
                onChange={(e) => setSourceSemesterId(e.target.value)}
                fullWidth
                required
                helperText="Select a semester to copy rooms and classes from"
              >
                {semesters.map((sem) => (
                  <MenuItem key={sem.id} value={sem.id}>
                    {sem.name} {sem.year} {sem.isStarred ? '⭐' : ''}
                  </MenuItem>
                ))}
              </TextField>

              <Alert severity="info">
                This will create a new semester with:
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>All rooms from the selected semester</li>
                  <li>All classes with their room assignments</li>
                  <li>Same schedule patterns and time slots</li>
                </ul>
                You can modify the cloned content after creation.
              </Alert>
            </>
          )}

          <TextField
            select
            label="Semester"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          >
            <MenuItem value="Spring">Spring</MenuItem>
            <MenuItem value="Summer I">Summer I</MenuItem>
            <MenuItem value="Summer II">Summer II</MenuItem>
            <MenuItem value="Fall">Fall</MenuItem>
          </TextField>

          <TextField
            select
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            fullWidth
            required
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
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
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  helperText: 'Select semester end date'
                } 
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={!name || !year || (isCloning && !sourceSemesterId)}
        >
          Add Semester
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSemesterModal;