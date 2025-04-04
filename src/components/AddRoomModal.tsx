import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
} from '@mui/material';
import { useAppContext } from '../context/AppContext';

interface AddRoomModalProps {
  open: boolean;
  onClose: () => void;
  semesterId: string;
}

const AddRoomModal: React.FC<AddRoomModalProps> = ({ open, onClose, semesterId }) => {
  const { addRoom } = useAppContext();
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!roomNumber || !capacity) {
      setError('Please fill in all fields');
      return;
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setError('Please enter a valid capacity');
      return;
    }

    try {
      addRoom(semesterId, roomNumber, capacityNum);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add room');
    }
  };

  const handleClose = () => {
    setRoomNumber('');
    setCapacity('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Room</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Room Number"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            fullWidth
          />
          <TextField
            label="Capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Room
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddRoomModal;