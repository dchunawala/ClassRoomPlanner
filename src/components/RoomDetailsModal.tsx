import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RoomCalendarView from './RoomCalendarView';
import { Room } from '../context/AppContext';

interface RoomDetailsModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({ open, onClose, room }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ pr: 6 }}>
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            Room {room.roomNumber} Schedule
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <RoomCalendarView roomId={room.id} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailsModal;