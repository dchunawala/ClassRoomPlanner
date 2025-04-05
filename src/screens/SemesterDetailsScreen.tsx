import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  TextField,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Select,
  FormHelperText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAppContext, Room, Class } from '../context/AppContext';
import RoomDetailsModal from '../components/RoomDetailsModal';
import AddClassModal from '../components/AddClassModal'; // Keep this for the modal button
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface NewRoom {
  roomNumber: string;
  capacity: string;
}

interface NewClass {
  courseCode: string;
  courseNumber: string;
  section: string;
  instructor: string;
  roomId: string;
  startTime: string;
  endTime: string;
  days: string[];
  className: string;
  classCode: string;
  studentCount: string;
}


const emptyRoom = (): NewRoom => ({
  roomNumber: '',
  capacity: '',
});

const emptyClass = (): NewClass => ({
  courseCode: '',
  courseNumber: '',
  section: '',
  instructor: '',
  className: '',
  classCode: '',
  studentCount: '',
  roomId: '',
  startTime: '',
  endTime: '',
  days: [],
});

const SemesterDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { semesters, rooms, classes, addRoom, addClass, editRoom, deleteRoom, editClass, deleteClass, checkRoomAvailability } = useAppContext();

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Modified useEffect to handle loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!semesters.find(s => s.id === id)) {
        navigate('/');
      }
      setIsLoading(false);
    }, 100); // Small delay to ensure context is loaded

    return () => clearTimeout(timer);
  }, [id, navigate, semesters]);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState<NewRoom>(emptyRoom());
  const [newClass, setNewClass] = useState<NewClass>(emptyClass()); // State for the inline add class row
  const [error, setError] = useState('');
  const [classError, setClassError] = useState('');

  // State for editing rooms (inline)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null); // Store ID instead of object
  const [editedRoomNumber, setEditedRoomNumber] = useState('');
  const [editedCapacity, setEditedCapacity] = useState('');

  // State for editing classes
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editedClass, setEditedClass] = useState<NewClass>(emptyClass());

  // State for confirmation dialogs
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string>('');
  const [classToDelete, setClassToDelete] = useState<string>('');

  // State for add class modal (optional, can keep button alongside inline add)
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);
  const [classToClone, setClassToClone] = useState<Class | null>(null);

  // --- Room Search State ---
  const [roomNumberSearch, setRoomNumberSearch] = useState('');
  const [capacitySearch, setCapacitySearch] = useState('');
  // --- End Room Search State ---

  // --- Class Search State ---
  const [courseCodeSearch, setCourseCodeSearch] = useState('');
  const [courseNumberSearch, setCourseNumberSearch] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');
  // --- End Class Search State ---

  const formatTime = (time: dayjs.Dayjs | null): string => {
    if (!time) return '';
    return time.format('h:mmA');
  };

  const validateTuesdayThursdayRestriction = (days: string[], startTime: string, endTime: string) => {
    const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])([AP]M)$/i;
    if ((startTime || endTime) && (!timeRegex.test(startTime) || !timeRegex.test(endTime))) {
        return { valid: false, message: 'Invalid time format. Please use format like 9:00AM or 2:30PM.' };
    }

    if (!startTime || !endTime) {
        return { valid: true };
    }


    if (days.includes('Tuesday') || days.includes('Thursday')) {
      const start = dayjs(startTime, 'h:mmA');
      const end = dayjs(endTime, 'h:mmA');
      const restrictedStart = dayjs('2:00PM', 'h:mmA');
      const restrictedEnd = dayjs('4:00PM', 'h:mmA');

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

  const semester = semesters.find(s => s.id === id);
  const semesterRooms = rooms.filter(r => r.semesterId === id);
  const semesterClasses = classes.filter(c => c.semesterId === id);

  // --- Filtered Data ---
  const filteredRooms = useMemo(() => {
    // Parse capacity search input once
    const searchCapacityNum = parseInt(capacitySearch);
    const isCapacitySearchValid = !isNaN(searchCapacityNum);

    return semesterRooms.filter(room => {
      const roomNumberMatch = room.roomNumber.toLowerCase().includes(roomNumberSearch.toLowerCase());
      // Capacity filter: Include if search is invalid/empty OR room capacity meets criteria
      const capacityMatch = !isCapacitySearchValid || room.capacity >= searchCapacityNum;
      return roomNumberMatch && capacityMatch;
    });
  }, [semesterRooms, roomNumberSearch, capacitySearch]);

 const searchCapacityNum = useMemo(() => {
   const parsedCapacity = parseInt(capacitySearch);
   return isNaN(parsedCapacity) ? null : parsedCapacity;
 }, [capacitySearch]);

 const filteredClasses = useMemo(() => {
    const isCapacitySearchValid = searchCapacityNum !== null;

    return semesterClasses.filter(cls => {
      const courseCodeMatch = cls.courseCode.toLowerCase().includes(courseCodeSearch.toLowerCase());
      const courseNumberMatch = cls.courseNumber.toLowerCase().includes(courseNumberSearch.toLowerCase());
      const sectionMatch = cls.section.toLowerCase().includes(sectionSearch.toLowerCase());
      const instructorMatch = cls.instructor.toLowerCase().includes(instructorSearch.toLowerCase());
      const roomData = rooms.find(r => r.id === cls.roomId);
      const roomNumber = roomData ? roomData.roomNumber : '';
      const roomCapacity = roomData ? roomData.capacity : 0;

      // Search room number without the "Room " prefix if it exists
      const roomMatch = roomNumber.toLowerCase().includes(roomSearch.toLowerCase());
      const scheduleString = `${cls.days?.join('')} ${cls.startTime}-${cls.endTime}`.toLowerCase();
      const scheduleMatch = scheduleString.includes(scheduleSearch.toLowerCase().replace(/,/g, ''));
      const studentsMatch = studentsSearch === '' || cls.studentCount.toString().includes(studentsSearch); // Added studentsMatch

      const capacityFilterMatch = !isCapacitySearchValid || roomCapacity >= searchCapacityNum;

      return courseCodeMatch &&
             courseNumberMatch &&
             sectionMatch &&
             instructorMatch &&
             roomMatch &&
             scheduleMatch &&
             capacityFilterMatch &&
             studentsMatch; // Added studentsMatch to return
    });
  }, [semesterClasses, rooms, courseCodeSearch, courseNumberSearch, sectionSearch, instructorSearch, roomSearch, scheduleSearch, searchCapacityNum, studentsSearch]); // Added studentsSearch to dependencies
  // --- End Filtered Data ---


  // Add loading state check
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!semester) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Semester not found</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {semester.name} {semester.year}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Rooms Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Rooms</Typography>
        <TableContainer component={Paper}>
          <Table sx={{ '& .MuiTableCell-root': { padding: '4px 8px', minWidth: '100px' }, '& .MuiTableCell-head': { minWidth: '100px', padding: '8px' } }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Search Room #"
                    value={roomNumberSearch}
                    onChange={(e) => setRoomNumberSearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Search Capacity"
                    value={capacitySearch}
                    onChange={(e) => setCapacitySearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id} hover>
                  {editingRoomId === room.id ? (
                    // --- Inline Edit Mode ---
                    <>
                      <TableCell>
                        <TextField
                          size="small"
                          value={editedRoomNumber}
                          onChange={(e) => setEditedRoomNumber(e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={editedCapacity}
                          onChange={(e) => setEditedCapacity(e.target.value)}
                          inputProps={{ min: 1 }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            // --- Save Logic (to be implemented fully) ---
                            if (!editedRoomNumber || !editedCapacity) {
                              setError('Please fill in all room fields');
                              return;
                            }
                            const capacityNum = parseInt(editedCapacity);
                            if (isNaN(capacityNum) || capacityNum <= 0) {
                              setError('Please enter a valid capacity');
                              return;
                            }
                            try {
                              const existingRoom = semesterRooms.find(r => r.roomNumber === editedRoomNumber && r.id !== editingRoomId);
                              if (existingRoom) {
                                  setError(`Room number "${editedRoomNumber}" already exists.`);
                                  return;
                              }
                              editRoom(editingRoomId!, editedRoomNumber, capacityNum);
                              setEditingRoomId(null); // Exit edit mode
                              setError('');
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to update room');
                            }
                            // --- End Save Logic ---
                          }}
                          aria-label="save room"
                          sx={{ mr: 1 }}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            // --- Cancel Logic ---
                            setEditingRoomId(null);
                            setError(''); // Clear any previous errors
                            // Reset edited values (optional, but good practice)
                            setEditedRoomNumber('');
                            setEditedCapacity('');
                            // --- End Cancel Logic ---
                          }}
                          aria-label="cancel edit"
                          >
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                    </>
                  ) : (
                    // --- Display Mode ---
                    <>
                      <TableCell>{room.roomNumber}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedRoom(room)}
                          sx={{ mr: 1 }}
                        >
                          View Schedule
                        </Button>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            // --- Start Editing Logic ---
                            setEditingRoomId(room.id);
                            setEditedRoomNumber(room.roomNumber);
                            setEditedCapacity(room.capacity.toString());
                            setError(''); // Clear errors when starting edit
                            // --- End Start Editing Logic ---
                          }}
                          aria-label="edit room"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setRoomToDelete(room.id);
                            setDeleteRoomDialogOpen(true);
                          }}
                          aria-label="delete room"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {/* Add Room Row */}
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="New Room Number"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    placeholder="New Capacity"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                    inputProps={{ min: 1 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      if (!newRoom.roomNumber || !newRoom.capacity) {
                        setError('Please fill in all room fields');
                        return;
                      }
                      const capacityNum = parseInt(newRoom.capacity);
                      if (isNaN(capacityNum) || capacityNum <= 0) {
                        setError('Please enter a valid capacity');
                        return;
                      }
                       // Check if room number already exists
                       const existingRoom = semesterRooms.find(r => r.roomNumber === newRoom.roomNumber);
                       if (existingRoom) {
                           setError(`Room number "${newRoom.roomNumber}" already exists.`);
                           return;
                       }
                      try {
                        addRoom(id!, newRoom.roomNumber, capacityNum);
                        setNewRoom(emptyRoom());
                        setError('');
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to add room');
                      }
                    }}
                  >
                    Add Room
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Classes Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Classes</Typography>
          {/* Optional: Keep the Add Class Modal button if desired */}
          {/* <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddClassModalOpen(true)}
          >
            Add Class (Modal)
          </Button> */}
        </Box>

        {classError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setClassError('')}>
            {classError}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table sx={{ '& .MuiTableCell-root': { padding: '8px 12px', minWidth: '100px' }, '& .MuiTableCell-head': { minWidth: '100px', padding: '8px' } }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Course Code"
                    value={courseCodeSearch}
                    onChange={(e) => setCourseCodeSearch(e.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 8 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Course Number"
                    value={courseNumberSearch}
                    onChange={(e) => setCourseNumberSearch(e.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 8 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Section"
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Search Instructor"
                    value={instructorSearch}
                    onChange={(e) => setInstructorSearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Search Students"
                    value={studentsSearch}
                    onChange={(e) => setStudentsSearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Search Room"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                
                <TableCell>
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder="Search Schedule" // Simplified placeholder
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Use filteredClasses */}
              
              {filteredClasses.map((cls) => (
                <TableRow key={cls.id} hover>
                  {editingClassId === cls.id ? (
                    // Editable row
                    <>
                      <TableCell>
                          <TextField
                            size="small"
                            label="Course Code"
                            value={editedClass.courseCode}
                            onChange={(e) => setEditedClass({ ...editedClass, courseCode: e.target.value })}
                            fullWidth
                          />
                      </TableCell>
                      <TableCell>
                         <TextField
                            size="small"
                            label="Course Number"
                            value={editedClass.courseNumber}
                            onChange={(e) => setEditedClass({ ...editedClass, courseNumber: e.target.value })}
                            fullWidth
                          />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={editedClass.section}
                          onChange={(e) => setEditedClass({ ...editedClass, section: e.target.value })}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={editedClass.instructor}
                          onChange={(e) => setEditedClass({ ...editedClass, instructor: e.target.value })}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={editedClass.studentCount}
                          onChange={(e) => setEditedClass({ ...editedClass, studentCount: e.target.value })}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={editedClass.roomId}
                            onChange={(e) => setEditedClass({ ...editedClass, roomId: e.target.value })}
                            error={Boolean(editedClass.roomId && editedClass.startTime && editedClass.endTime && editedClass.days.length > 0 &&
                              !checkRoomAvailability(editedClass.roomId, editedClass.startTime, editedClass.endTime, editedClass.days, cls.id).available)}
                          >
                            {semesterRooms
                              .map((room) => (
                                <MenuItem key={room.id} value={room.id}>
                                  {room.roomNumber}
                                </MenuItem>
                              ))}
                          </Select>
                          {editedClass.roomId && editedClass.startTime && editedClass.endTime && editedClass.days.length > 0 &&
                            !checkRoomAvailability(editedClass.roomId, editedClass.startTime, editedClass.endTime, editedClass.days, cls.id).available && (
                            <FormHelperText error>Room not available for selected time</FormHelperText>
                          )}
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <ToggleButtonGroup
                            size="small"
                            value={editedClass.days}
                            onChange={(_, newDays) => setEditedClass({ ...editedClass, days: newDays })}
                            aria-label="days"
                            sx={{ width: '100%' }}
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                              <ToggleButton key={day} value={day} aria-label={day}>
                                {day.charAt(0)}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TimePicker
                                label="Start Time"
                                value={editedClass.startTime ? dayjs(editedClass.startTime, 'h:mmA') : null}
                                onChange={(newValue) => setEditedClass({ ...editedClass, startTime: formatTime(newValue as dayjs.Dayjs | null) })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                              />
                              <TimePicker
                                label="End Time"
                                value={editedClass.endTime ? dayjs(editedClass.endTime, 'h:mmA') : null}
                                onChange={(newValue) => setEditedClass({ ...editedClass, endTime: formatTime(newValue as dayjs.Dayjs | null) })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                              />
                            </Box>
                          </LocalizationProvider>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            const { courseCode, courseNumber, section, instructor, roomId, startTime, endTime, days, studentCount } = editedClass;

                            if (!courseCode || !courseNumber || !section || !instructor || !roomId || !startTime || !endTime || days.length === 0 || !studentCount) {
                              setClassError('Please fill in all class fields');
                              return;
                            }

                            const validationResult = validateTuesdayThursdayRestriction(days, startTime, endTime);
                            if (!validationResult.valid) {
                              setClassError(validationResult.message || 'Invalid time slot selected');
                              return;
                            }

                            const availability = checkRoomAvailability(roomId, startTime, endTime, days, cls.id);
                            if (!availability.available) {
                                // Fixed: Use availability.conflict
                                setClassError(`Room not available. Conflicts with: ${availability.conflict}`);
                                return;
                            }

                            try {
                              editClass(cls.id, {
                                semesterId: id!,
                                ...editedClass,
                                className: editedClass.className,
                                classCode: editedClass.classCode,
                                studentCount: editedClass.studentCount
                              });
                              setEditingClassId(null);
                              setEditedClass(emptyClass());
                              setClassError('');
                            } catch (err) {
                              setClassError(err instanceof Error ? err.message : 'Failed to update class');
                            }
                          }}
                          aria-label="save class"
                          sx={{ mr: 1 }}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setEditingClassId(null);
                            setEditedClass(emptyClass());
                            setClassError('');
                          }}
                          aria-label="cancel edit"
                        >
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                    </>
                  ) : (
                    // Non-editable row
                    <>
                      <TableCell>{cls.courseCode}</TableCell>
                      <TableCell>{cls.courseNumber}</TableCell>
                      <TableCell>{cls.section}</TableCell>
                      <TableCell>{cls.instructor}</TableCell>
                      <TableCell>{cls.studentCount}</TableCell>
                      {/* Removed "Room " prefix */}
                      <TableCell>{rooms.find(r => r.id === cls.roomId)?.roomNumber}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box>{cls.days?.join(', ')}</Box>
                          <Box>{cls.startTime} - {cls.endTime}</Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
                          <ToggleButtonGroup
                            size="small"
                            color="primary"
                            onClick={() => {
                              setEditingClassId(cls.id);
                              setEditedClass({
                                courseCode: cls.courseCode,
                                courseNumber: cls.courseNumber,
                                section: cls.section,
                                instructor: cls.instructor,
                                roomId: cls.roomId,
                                startTime: cls.startTime,
                                endTime: cls.endTime,
                                days: cls.days,
                                className: cls.className,
                                classCode: cls.classCode,
                                studentCount: cls.studentCount
                              });
                              setClassError('');
                            }}
                            aria-label="edit class"
                          >
                            <EditIcon />
                          </ToggleButtonGroup>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              setNewClass({
                                courseCode: cls.courseCode,
                                courseNumber: cls.courseNumber,
                                section: cls.section,
                                instructor: cls.instructor,
                                roomId: cls.roomId,
                                startTime: cls.startTime,
                                endTime: cls.endTime,
                                days: cls.days,
                                className: cls.className,
                                classCode: cls.classCode,
                                studentCount: cls.studentCount,
                              });
                            }}
                            aria-label="clone class"
                          >
                            <ContentCopyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setClassToDelete(cls.id);
                              setDeleteClassDialogOpen(true);
                            }}
                            aria-label="delete class"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              
              <TableRow>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    placeholder="Course Code"
                                    value={newClass.courseCode}
                                    onChange={(e) => setNewClass({ ...newClass, courseCode: e.target.value })}
                                    fullWidth
                                    inputProps={{ maxLength: 6 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    placeholder="Course Number"
                                    value={newClass.courseNumber}
                                    onChange={(e) => setNewClass({ ...newClass, courseNumber: e.target.value })}
                                    fullWidth
                                    inputProps={{ maxLength: 6 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    placeholder="Section"
                                    value={newClass.section}
                                    onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    placeholder="Instructor"
                                    value={newClass.instructor}
                                    onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    placeholder="Students"
                                    value={newClass.studentCount}
                                    onChange={(e) => setNewClass({ ...newClass, studentCount: e.target.value })}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      displayEmpty
                                      value={newClass.roomId}
                                      onChange={(e) => setNewClass({ ...newClass, roomId: e.target.value })}
                                      renderValue={(selected) => {
                                        if (!selected) {
                                          return <em style={{ color: 'grey' }}>Select Room</em>;
                                        }
                                        const room = semesterRooms.find(r => r.id === selected);
                                        return room?.roomNumber;
                                      }}
                                      error={Boolean(newClass.roomId && newClass.startTime && newClass.endTime && newClass.days.length > 0 &&
                                        !checkRoomAvailability(newClass.roomId, newClass.startTime, newClass.endTime, newClass.days).available)}
                                    >
                                      <MenuItem disabled value="">
                                        <em>Select Room</em>
                                      </MenuItem>
                                      {semesterRooms.map((room) => (
                                        <MenuItem key={room.id} value={room.id}>
                                          {room.roomNumber}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <ToggleButtonGroup
                                      size="small"
                                      value={newClass.days}
                                      onChange={(_, newDays) => setNewClass({ ...newClass, days: newDays })}
                                      aria-label="days"
                                    >
                                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                                        <ToggleButton key={day} value={day} aria-label={day}>
                                          {day.charAt(0)}
                                        </ToggleButton>
                                      ))}
                                    </ToggleButtonGroup>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <TimePicker
                                          label="Start Time"
                                          value={newClass.startTime ? dayjs(newClass.startTime, 'h:mmA') : null}
                                          onChange={(newValue) => setNewClass({ ...newClass, startTime: formatTime(newValue) })}
                                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                        />
                                        <TimePicker
                                          label="End Time"
                                          value={newClass.endTime ? dayjs(newClass.endTime, 'h:mmA') : null}
                                          onChange={(newValue) => setNewClass({ ...newClass, endTime: formatTime(newValue) })}
                                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                        />
                                      </LocalizationProvider>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                      const { courseCode, courseNumber, section, instructor, roomId, startTime, endTime, days, studentCount } = newClass;
                                      if (!courseCode || !courseNumber || !section || !instructor || !roomId || !startTime || !endTime || days.length === 0 || !studentCount) {
                                        setClassError('Please fill in all class fields');
                                        return;
                                      }
                                      const validationResult = validateTuesdayThursdayRestriction(days, startTime, endTime);
                                      if (!validationResult.valid) {
                                        setClassError(validationResult.message || 'Invalid time slot selected');
                                        return;
                                      }
                                      const availability = checkRoomAvailability(roomId, startTime, endTime, days, '');
                                      if (!availability.available) {
                                        setClassError(`Room is not available during selected time slot. Conflicts with: ${availability.conflict}`);
                                        return;
                                      }
                                      try {
                                        addClass({
                                          semesterId: id!,
                                          ...newClass
                                        });
                                        setNewClass(emptyClass());
                                        setClassError('');
                                      } catch (err) {
                                        setClassError(err instanceof Error ? err.message : 'Failed to add class');
                                      }
                                    }}
                                  >
                                    Add Class
                                  </Button>
                                </TableCell>
                              </TableRow>
                {/* --- End Add Class Row --- */}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {selectedRoom && (
        <RoomDetailsModal
          open={Boolean(selectedRoom)}
          onClose={() => setSelectedRoom(null)}
          room={selectedRoom}
        />
      )}

      {/* Edit Room Dialog Removed - Now handled inline */}

      {/* Delete Room Confirmation Dialog */}
      <Dialog
        open={deleteRoomDialogOpen}
        onClose={() => setDeleteRoomDialogOpen(false)}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this room? Associated classes will also be removed. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRoomDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              try {
                deleteRoom(roomToDelete);
                setDeleteRoomDialogOpen(false);
                setRoomToDelete('');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete room');
                setDeleteRoomDialogOpen(false);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Class Confirmation Dialog */}
      <Dialog
        open={deleteClassDialogOpen}
        onClose={() => setDeleteClassDialogOpen(false)}
      >
        <DialogTitle>Delete Class</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this class? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteClassDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              try {
                deleteClass(classToDelete);
                setDeleteClassDialogOpen(false);
                setClassToDelete('');
              } catch (err) {
                setClassError(err instanceof Error ? err.message : 'Failed to delete class');
                setDeleteClassDialogOpen(false);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Class Modal (Optional - can be removed if only inline add is desired) */}
        <>
        </>
      <AddClassModal
        open={addClassModalOpen}
        onClose={() => {
          setAddClassModalOpen(false);
          setClassToClone(null);
        }}
        rooms={semesterRooms}
        semesterId={id!}
        classToClone={classToClone}
      />
    </Box>
  );
};

export default SemesterDetailsScreen;
