import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  FormHelperText,
} from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const AddClassModal = ({ open, onClose, rooms, semesterId }) => {
  const { addClass, checkRoomAvailability } = useAppContext();
  const [classEntries, setClassEntries] = useState([{ 
    courseCode: '', 
    courseNumber: '', 
    section: '', 
    instructor: '', 
    roomId: '', 
    startTime: '', 
    endTime: '', 
    days: [] 
  }]);
  const [error, setError] = useState('');
  const [availableRoomsMap, setAvailableRoomsMap] = useState({});

  const formatTime = (time) => (time ? time.format('h:mmA') : '');

  // Update available rooms when time or days change for any entry
  useEffect(() => {
    const newAvailableRoomsMap = {};
    
    classEntries.forEach((entry, index) => {
      if (entry.startTime && entry.endTime && entry.days && entry.days.length > 0) {
        const filteredRooms = rooms.filter(room => {
          const availability = checkRoomAvailability(room.id, entry.startTime, entry.endTime, entry.days);
          return availability.available;
        });
        newAvailableRoomsMap[index] = filteredRooms;
      } else {
        newAvailableRoomsMap[index] = rooms;
      }
    });
    
    setAvailableRoomsMap(newAvailableRoomsMap);
  }, [classEntries, rooms, checkRoomAvailability]);

  const handleAddRow = () => {
    setClassEntries([...classEntries, { 
      courseCode: '', 
      courseNumber: '', 
      section: '', 
      instructor: '', 
      roomId: '', 
      startTime: '', 
      endTime: '', 
      days: [] 
    }]);
  };

  const handleRemoveRow = (index) => {
    if (classEntries.length > 1) {
      setClassEntries(classEntries.filter((_, i) => i !== index));
    }
  };

  const handleEntryChange = (index, field, value) => {
    const updatedEntries = [...classEntries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value
    };
    setClassEntries(updatedEntries);
  };

  // Validate time format (e.g., 9:00AM or 2:30PM)
  const validateTimeFormat = (time) => {
    const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])([AP]M)$/i;
    return timeRegex.test(time);
  };

  // Check Tuesday/Thursday restriction (no classes from 2:00PM to 4:00PM)
  const validateTuesdayThursdayRestriction = (days, startTime, endTime) => {
    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return { valid: false, message: 'Invalid time format. Please use format like 9:00AM or 2:30PM.' };
    }

    if (days.includes('Tuesday') || days.includes('Thursday')) {
      const start = dayjs(startTime, 'h:mmA');
      const end = dayjs(endTime, 'h:mmA');
      const restrictedStart = dayjs('2:00PM', 'h:mmA');
      const restrictedEnd = dayjs('4:00PM', 'h:mmA');
      
      // Check if class time overlaps with restricted time (2:00PM-4:00PM)
      const overlapsRestrictedTime = 
        (start.isBefore(restrictedEnd) && end.isAfter(restrictedStart)) ||
        start.isSame(restrictedStart) || 
        end.isSame(restrictedEnd);
      
      if (overlapsRestrictedTime) {
        return { valid: false, message: 'Tuesday/Thursday classes cannot be scheduled between 2:00PM and 4:00PM.' };
      }
    }
    
    return { valid: true };
  };

  const handleSave = () => {
    // Validate all entries
    for (let i = 0; i < classEntries.length; i++) {
      const entry = classEntries[i];
      if (!entry.courseCode || !entry.courseNumber || !entry.section || 
          !entry.instructor || !entry.roomId || !entry.startTime || 
          !entry.endTime || entry.days.length === 0) {
        setError(`Please fill in all fields for class ${i + 1}`);
        return;
      }

      // Validate time format
      if (!validateTimeFormat(entry.startTime) || !validateTimeFormat(entry.endTime)) {
        setError(`Invalid time format for class ${i + 1}. Please use format like 9:00AM or 2:30PM.`);
        return;
      }

      // Check Tuesday/Thursday restriction
      const validationResult = validateTuesdayThursdayRestriction(entry.days, entry.startTime, entry.endTime);
      if (!validationResult.valid) {
        setError(`Class ${i + 1}: ${validationResult.message}`);
        return;
      }
    }

    try {
      // Add all classes
      classEntries.forEach(entry => {
        addClass({
          semesterId,
          courseCode: entry.courseCode,
          courseNumber: entry.courseNumber,
          section: entry.section,
          instructor: entry.instructor,
          roomId: entry.roomId,
          startTime: entry.startTime,
          endTime: entry.endTime,
          days: entry.days
        });
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add classes');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Add New Class</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TableContainer component={Paper}>
          <Table size="small" sx={{ '& .MuiTableCell-root': { padding: '8px', textAlign: 'center' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Course Code</TableCell>
                <TableCell>Course Number</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classEntries.map((entry, index) => {
                const availableRooms = availableRoomsMap[index] || rooms;
                const noRoomsAvailable = availableRooms.length === 0 && 
                                        entry.startTime && 
                                        entry.endTime && 
                                        entry.days.length > 0;
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField 
                        size="small" 
                        value={entry.courseCode} 
                        onChange={(e) => handleEntryChange(index, 'courseCode', e.target.value)}
                        fullWidth 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        size="small" 
                        value={entry.courseNumber} 
                        onChange={(e) => handleEntryChange(index, 'courseNumber', e.target.value)}
                        fullWidth 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        size="small" 
                        value={entry.section} 
                        onChange={(e) => handleEntryChange(index, 'section', e.target.value)}
                        fullWidth 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        size="small" 
                        value={entry.instructor} 
                        onChange={(e) => handleEntryChange(index, 'instructor', e.target.value)}
                        fullWidth 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        select 
                        size="small" 
                        value={entry.roomId} 
                        onChange={(e) => handleEntryChange(index, 'roomId', e.target.value)}
                        fullWidth
                        disabled={noRoomsAvailable}
                        error={noRoomsAvailable}
                      >
                        {availableRooms.map((room) => (
                          <MenuItem key={room.id} value={room.id}>Room {room.roomNumber}</MenuItem>
                        ))}
                      </TextField>
                      {noRoomsAvailable && (
                        <FormHelperText error>No rooms available for selected time</FormHelperText>
                      )}
                    </TableCell>
                    <TableCell>
                      <ToggleButtonGroup 
                        size="small" 
                        value={entry.days} 
                        onChange={(_, newDays) => handleEntryChange(index, 'days', newDays)}
                        multiple
                      >
                        <ToggleButton value="Monday">M</ToggleButton>
                        <ToggleButton value="Tuesday">T</ToggleButton>
                        <ToggleButton value="Wednesday">W</ToggleButton>
                        <ToggleButton value="Thursday">Th</ToggleButton>
                        <ToggleButton value="Friday">F</ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                    <TableCell>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker 
                          value={entry.startTime ? dayjs(entry.startTime, 'h:mmA') : null} 
                          onChange={(newValue) => handleEntryChange(index, 'startTime', formatTime(newValue))}
                          ampm 
                          slotProps={{ textField: { size: 'small', fullWidth: true } }} 
                        />
                      </LocalizationProvider>
                    </TableCell>
                    <TableCell>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker 
                          value={entry.endTime ? dayjs(entry.endTime, 'h:mmA') : null} 
                          onChange={(newValue) => handleEntryChange(index, 'endTime', formatTime(newValue))}
                          ampm 
                          slotProps={{ textField: { size: 'small', fullWidth: true } }} 
                        />
                      </LocalizationProvider>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleRemoveRow(index)} disabled={classEntries.length === 1}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ padding: '12px' }}>
                  <Button startIcon={<AddIcon />} onClick={handleAddRow} variant="outlined" size="small">
                    Add Another Class
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClassModal;
