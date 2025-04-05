import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAppContext } from '../context/AppContext';

interface EditClassModalProps {
  open: boolean;
  onClose: () => void;
  semesterId: string;
  classData: {
    id: string;
    courseCode: string;
    courseNumber: string;
    section: string;
    instructor: string;
    roomId: string;
    startTime: string;
    endTime: string;
    days: string[];
    className: string; // Added className
    classCode: string; // Added classCode
    studentCount: string; // Added studentCount
  };
}

const EditClassModal: React.FC<EditClassModalProps> = ({
  open,
  onClose,
  semesterId,
  classData,
}) => {
  const { rooms, editClass, checkRoomAvailability } = useAppContext();
  const semesterRooms = rooms.filter(r => r.semesterId === semesterId);

  const [courseCode, setCourseCode] = useState(classData.courseCode);
  const [courseNumber, setCourseNumber] = useState(classData.courseNumber);
  const [section, setSection] = useState(classData.section);
  const [instructor, setInstructor] = useState(classData.instructor);
  const [roomId, setRoomId] = useState(classData.roomId);
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(
    classData.startTime ? dayjs(classData.startTime, 'h:mmA') : null
  );
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(
    classData.endTime ? dayjs(classData.endTime, 'h:mmA') : null
  );
  const [days, setDays] = useState<string[]>(classData.days || []);
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState<typeof semesterRooms>(semesterRooms);

  // Update available rooms when time or days change
  useEffect(() => {
    if (startTime && endTime && days.length > 0) {
      const formattedStartTime = formatTime(startTime);
      const formattedEndTime = formatTime(endTime);
      
      const filteredRooms = semesterRooms.filter(room => {
        const availability = checkRoomAvailability(room.id, formattedStartTime, formattedEndTime, days, classData.id);
        return availability.available;
      });
      
      setAvailableRooms(filteredRooms);
    } else {
      setAvailableRooms(semesterRooms);
    }
  }, [startTime, endTime, days, semesterRooms, checkRoomAvailability, classData.id]);

  useEffect(() => {
    if (open) {
      setCourseCode(classData.courseCode);
      setCourseNumber(classData.courseNumber);
      setSection(classData.section);
      setInstructor(classData.instructor);
      setRoomId(classData.roomId);
      setStartTime(classData.startTime ? dayjs(classData.startTime, 'h:mmA') : null);
      setEndTime(classData.endTime ? dayjs(classData.endTime, 'h:mmA') : null);
      setDays(classData.days || []);
      setError('');
    }
  }, [open, classData]);

  const handleDaysChange = (_: React.MouseEvent<HTMLElement>, newDays: string[]) => {
    setDays(newDays);
  };

  const formatTime = (time: dayjs.Dayjs | null): string => {
    if (!time) return '';
    return time.format('h:mmA');
  };

  // Validate time format (e.g., 9:00AM or 2:30PM)
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])([AP]M)$/i;
    return timeRegex.test(time);
  };

  // Check Tuesday/Thursday restriction (no classes from 2:00PM to 4:00PM)
  const validateTuesdayThursdayRestriction = (days: string[], startTime: string, endTime: string): { valid: boolean; message?: string } => {
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

  const handleSubmit = () => {
    if (!courseCode || !courseNumber || !section || !instructor || !roomId || !startTime || !endTime || days.length === 0) {
      setError('Please fill in all fields');
      return;
    }

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // Validate time format
    if (!validateTimeFormat(formattedStartTime) || !validateTimeFormat(formattedEndTime)) {
      setError('Invalid time format. Please use format like 9:00AM or 2:30PM.');
      return;
    }

    // Check Tuesday/Thursday restriction
    const validationResult = validateTuesdayThursdayRestriction(days, formattedStartTime, formattedEndTime);
    if (!validationResult.valid) {
      setError(validationResult.message || 'Invalid time slot selected');
      return;
    }

    try {
      editClass(classData.id, {
        semesterId,
        courseCode,
        courseNumber,
        section,
        instructor,
        roomId,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        days,
        className: classData.className, // Added className
        classCode: classData.classCode, // Added classCode
        studentCount: classData.studentCount // Added studentCount
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit class');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Class</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <TextField
            label="Course Code"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            sx={{ width: '30%' }}
          />
          <TextField
            label="Course Number"
            value={courseNumber}
            onChange={(e) => setCourseNumber(e.target.value)}
            sx={{ width: '30%' }}
          />
          <TextField
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            sx={{ width: '30%' }}
          />
          <TextField
            label="Instructor"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            sx={{ width: '100%' }}
          />

          <FormControl sx={{ width: '100%' }}>
            <InputLabel>Room</InputLabel>
            <Select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              label="Room"
              error={availableRooms.length === 0 && startTime !== null && endTime !== null && days.length > 0}
            >
              {availableRooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  Room {room.roomNumber} (Capacity: {room.capacity})
                </MenuItem>
              ))}
            </Select>
            {availableRooms.length === 0 && startTime !== null && endTime !== null && days.length > 0 && (
              <FormHelperText error>No rooms available for selected time slot</FormHelperText>
            )}
          </FormControl>

          <Box sx={{ width: '100%', mt: 2 }}>
            <InputLabel sx={{ mb: 1 }}>Days</InputLabel>
            <ToggleButtonGroup
              value={days}
              onChange={handleDaysChange}
              aria-label="class days"
              color="primary"
              sx={{ flexWrap: 'wrap' }}
              fullWidth
            >
              <ToggleButton value="Monday" aria-label="Monday">
                Monday
              </ToggleButton>
              <ToggleButton value="Tuesday" aria-label="Tuesday">
                Tuesday
              </ToggleButton>
              <ToggleButton value="Wednesday" aria-label="Wednesday">
                Wednesday
              </ToggleButton>
              <ToggleButton value="Thursday" aria-label="Thursday">
                Thursday
              </ToggleButton>
              <ToggleButton value="Friday" aria-label="Friday">
                Friday
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={(newValue: dayjs.Dayjs | null) => setStartTime(newValue)}
              sx={{ width: '48%' }}
            />
            <TimePicker
              label="End Time"
              value={endTime}
              onChange={(newValue: dayjs.Dayjs | null) => setEndTime(newValue)}
              sx={{ width: '48%' }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClassModal;