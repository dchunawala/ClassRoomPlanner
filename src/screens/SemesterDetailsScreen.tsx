import React, { useState } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppContext } from '../context/AppContext';
import RoomDetailsModal from '../components/RoomDetailsModal';
import AddClassModal from '../components/AddClassModal';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

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
  roomId: '',
  startTime: '',
  endTime: '',
  days: [],
});

const SemesterDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { semesters, rooms, classes, addRoom, addClass, editRoom, deleteRoom, editClass, deleteClass, checkRoomAvailability, checkScheduleConflict } = useAppContext();
  
  const [selectedRoom, setSelectedRoom] = useState<typeof semesterRooms[0] | null>(null);
  const [newRoom, setNewRoom] = useState<NewRoom>(emptyRoom());
  const [newClass, setNewClass] = useState<NewClass>(emptyClass());
  const [error, setError] = useState('');
  const [classError, setClassError] = useState('');
  
  // State for editing rooms
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
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
  
  // State for add class modal
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);
  
  const formatTime = (time: dayjs.Dayjs | null): string => {
    if (!time) return '';
    return time.format('h:mmA');
  };

  const validateTuesdayThursdayRestriction = (days: string[], startTime: string, endTime: string) => {
    // Check if time format is valid
    const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])([AP]M)$/i;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return { valid: false, message: 'Invalid time format. Please use format like 9:00AM or 2:30PM.' };
    }

    // Check if Tuesday or Thursday is selected
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

  const semester = semesters.find(s => s.id === id);
  const semesterRooms = rooms.filter(r => r.semesterId === id);
  const semesterClasses = classes.filter(c => c.semesterId === id);

  if (!semester) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Semester not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
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
          <Table sx={{ '& .MuiTableCell-root': { padding: '4px 8px', minWidth: '100px' }, '& .MuiTableCell-head': { minWidth: '100px' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Room Number</TableCell>
                <TableCell>Capacity</TableCell>
              
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {semesterRooms.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell>Room {room.roomNumber}</TableCell>
                  <TableCell>{room.capacity} students</TableCell>
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
                      color="error"
                      onClick={() => {
                        setRoomToDelete(room.id);
                        setDeleteRoomDialogOpen(true);
                      }}
                      sx={{ mr: 1 }}
                      aria-label="delete room"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setEditingRoom(room);
                        setEditedRoomNumber(room.roomNumber);
                        setEditedCapacity(room.capacity.toString());
                      }}
                      aria-label="edit room"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Room Number"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    placeholder="Capacity"
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddClassModalOpen(true)}
          >
            Add Class
          </Button>
        </Box>

        {classError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setClassError('')}>
            {classError}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table sx={{ '& .MuiTableCell-root': { padding: '8px 12px', minWidth: '100px' }, '& .MuiTableCell-head': { minWidth: '100px' } }}>
            <TableHead>
              <TableRow>
                <TableCell width="15%">Course</TableCell>
                <TableCell width="5%">Section</TableCell>
                <TableCell width="15%">Instructor</TableCell>
                <TableCell width="15%">Room</TableCell>
                <TableCell width="30%">Schedule</TableCell>
                <TableCell width="20%" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {semesterClasses.map((cls) => (
                <TableRow key={cls.id} hover>
                  {editingClassId === cls.id ? (
                    // Editable row
                    <>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small"
                            value={editedClass.courseCode}
                            onChange={(e) => setEditedClass({ ...editedClass, courseCode: e.target.value })}
                            sx={{ width: '50%' }}
                          />
                          <TextField
                            size="small"
                            value={editedClass.courseNumber}
                            onChange={(e) => setEditedClass({ ...editedClass, courseNumber: e.target.value })}
                            sx={{ width: '50%' }}
                          />
                        </Box>
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
                        <FormControl fullWidth size="small">
                          <Select
                            value={editedClass.roomId}
                            onChange={(e) => setEditedClass({ ...editedClass, roomId: e.target.value })}
                            error={editedClass.startTime && editedClass.endTime && editedClass.days.length > 0 && 
                              !checkRoomAvailability(editedClass.roomId, editedClass.startTime, editedClass.endTime, editedClass.days, cls.id).available}
                          >
                            {semesterRooms
                              .filter(room => {
                                if (!editedClass.startTime || !editedClass.endTime || editedClass.days.length === 0) {
                                  return true; // Show all rooms if schedule is not complete
                                }
                                const availability = checkRoomAvailability(
                                  room.id, 
                                  editedClass.startTime, 
                                  editedClass.endTime, 
                                  editedClass.days,
                                  cls.id
                                );
                                return availability.available;
                              })
                              .map((room) => (
                                <MenuItem key={room.id} value={room.id}>
                                  Room {room.roomNumber}
                                </MenuItem>
                              ))}
                          </Select>
                          {editedClass.startTime && editedClass.endTime && editedClass.days.length > 0 && 
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
                                label="Start"
                                value={editedClass.startTime ? dayjs(editedClass.startTime, 'h:mmA') : null}
                                onChange={(newValue) => setEditedClass({ ...editedClass, startTime: formatTime(newValue) })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                              />
                              <TimePicker
                                label="End"
                                value={editedClass.endTime ? dayjs(editedClass.endTime, 'h:mmA') : null}
                                onChange={(newValue) => setEditedClass({ ...editedClass, endTime: formatTime(newValue) })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                              />
                            </LocalizationProvider>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            const { courseCode, courseNumber, section, instructor, roomId, startTime, endTime, days } = editedClass;

                            if (!courseCode || !courseNumber || !section || !instructor || !roomId || !startTime || !endTime || days.length === 0) {
                              setClassError('Please fill in all class fields');
                              return;
                            }

                            const validationResult = validateTuesdayThursdayRestriction(days, startTime, endTime);
                            if (!validationResult.valid) {
                              setClassError(validationResult.message);
                              return;
                            }

                            try {
                              editClass(cls.id, {
                                semesterId: id!,
                                ...editedClass
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
                      <TableCell>{cls.courseCode} {cls.courseNumber}</TableCell>
                      <TableCell>{cls.section}</TableCell>
                      <TableCell>{cls.instructor}</TableCell>
                      <TableCell>Room {rooms.find(r => r.id === cls.roomId)?.roomNumber}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box>{cls.days?.join(', ')}</Box>
                          <Box>{cls.startTime} - {cls.endTime}</Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
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
                              days: cls.days
                            });
                          }}
                          aria-label="edit class"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
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
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <TextField
                      size="small"
                      placeholder="Course Code"
                      value={newClass.courseCode}
                      onChange={(e) => setNewClass({ ...newClass, courseCode: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      placeholder="Course Number"
                      value={newClass.courseNumber}
                      onChange={(e) => setNewClass({ ...newClass, courseNumber: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                  </Box>
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
                    select
                    size="small"
                    value={newClass.roomId}
                    onChange={(e) => setNewClass({ ...newClass, roomId: e.target.value })}
                    fullWidth
                  >
                    {semesterRooms.map((room) => (
                      <MenuItem key={room.id} value={room.id}>
                        Room {room.roomNumber}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      const { courseCode, courseNumber, section, instructor, roomId, startTime, endTime, days } = newClass;

                      if (!courseCode || !courseNumber || !section || !instructor || !roomId || !startTime || !endTime || days.length === 0) {
                        setClassError('Please fill in all class fields');
                        return;
                      }

                      const validationResult = validateTuesdayThursdayRestriction(days, startTime, endTime);
                      if (!validationResult.valid) {
                        setClassError(validationResult.message);
                        return;
                      }

                      if (!checkRoomAvailability(roomId, startTime, endTime, days)) {
                        setClassError('Room is not available during selected time slot');
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

      {/* Edit Room Dialog */}
      <Dialog open={Boolean(editingRoom)} onClose={() => setEditingRoom(null)}>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TableCell>
              <TextField
                value={editedRoomNumber}
                onChange={(e) => setEditedRoomNumber(e.target.value)}
                variant="standard"
                fullWidth
              />
            </TableCell>
            <TableCell>
              <TextField
                value={editedCapacity}
                onChange={(e) => setEditedCapacity(e.target.value)}
                variant="standard"
                fullWidth
              />
            </TableCell>
            <TableCell align="right">
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => {
                  editRoom(editingRoom.id, editedRoomNumber, parseInt(editedCapacity));
                  setEditingRoom(null);
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setEditingRoom(null)}
              >
                Cancel
              </Button>
            </TableCell>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRoom(null)}>Cancel</Button>
          <Button 
            onClick={() => {
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
                editRoom(editingRoom!.id, editedRoomNumber, capacityNum);
                setEditingRoom(null);
                setError('');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update room');
              }
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Room Confirmation Dialog */}
      <Dialog
        open={deleteRoomDialogOpen}
        onClose={() => setDeleteRoomDialogOpen(false)}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this room? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRoomDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              try {
                deleteRoom(roomToDelete);
                setDeleteRoomDialogOpen(false);
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

      {/* Edit Class Dialog removed - now using inline editing */}

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

      {/* Add Class Modal */}
      <AddClassModal
        open={addClassModalOpen}
        onClose={() => setAddClassModalOpen(false)}
        rooms={semesterRooms}
        semesterId={id!}
      />
    </Box>
  );
};

export default SemesterDetailsScreen;