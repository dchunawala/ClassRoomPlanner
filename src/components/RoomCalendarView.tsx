import React from 'react';
import {
  Box,
  Paper,
  Typography,
  styled,
} from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { Class } from '../context/AppContext';

interface RoomCalendarViewProps {
  roomId: string;
}

const TimeSlot = styled(Box)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1),
  height: '57px',
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.grey[50]
  },
  boxSizing: 'border-box',
  marginTop: 0
}));

const DayHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  textAlign: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.grey[100],
}));

const TimeLabel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  paddingTop: 0,
  borderRight: `1px none ${theme.palette.divider}`,
  borderBottom: `1px none ${theme.palette.divider}`,
  width: '80px',
  height: '57px',
  textAlign: 'right',
  position: 'relative',
  zIndex: 1,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start'
}));

const ClassBlock = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  left: '4px',
  right: '4px',
  padding: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  overflow: 'hidden',
  fontSize: '0.8rem',
  cursor: 'pointer',
  zIndex: 2,
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  borderLeft: `4px solid ${theme.palette.primary.dark}`,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const START_TIME = 8; // 8 AM
const END_TIME = 24; // 10 PM

const RoomCalendarView: React.FC<RoomCalendarViewProps> = ({ roomId }) => {
  const { classes } = useAppContext();
  const roomClasses = classes.filter(c => c.roomId === roomId);

  const getTimeString = (hour: number) => {
    return `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getClassPosition = (classItem: Class) => {
    // Parse time in h:mmA format (e.g., "9:30AM" or "2:00PM")
    const startTimeParts = classItem.startTime.match(/^(\d+)(?::([0-9]{2}))?\s*([AP]M)?$/i);
    const endTimeParts = classItem.endTime.match(/^(\d+)(?::([0-9]{2}))?\s*([AP]M)?$/i);
    
    if (!startTimeParts || !endTimeParts) {
      console.error('Invalid time format', classItem.startTime, classItem.endTime);
      return { top: 0, height: 60 }; // Default fallback
    }
    
    // Extract hours, minutes, and AM/PM
    let startHour = parseInt(startTimeParts[1]);
    const startMinute = parseInt(startTimeParts[2] || '0');
    const startAmPm = startTimeParts[3] ? startTimeParts[3].toUpperCase() : 'AM';
    
    let endHour = parseInt(endTimeParts[1]);
    const endMinute = parseInt(endTimeParts[2] || '0');
    const endAmPm = endTimeParts[3] ? endTimeParts[3].toUpperCase() : 'AM';
    
    // Convert to 24-hour format
    if (startAmPm === 'PM' && startHour < 12) startHour += 12;
    if (startAmPm === 'AM' && startHour === 12) startHour = 0;
    if (endAmPm === 'PM' && endHour < 12) endHour += 12;
    if (endAmPm === 'AM' && endHour === 12) endHour = 0;
    
    // Calculate position based on the time slots
    // Each hour slot is 57px (TimeSlot height)
    // The header is 50px tall
    // For each hour past START_TIME, move down by the TimeSlot height
    // For each minute, move down proportionally (57px/60min = 0.95px per minute)
    const headerHeight = 50;
    const hourHeight = 57; // TimeSlot height
    const minuteRatio = hourHeight / 60; // px per minute
    
    const top = headerHeight + ((startHour - START_TIME) * hourHeight) + (startMinute * minuteRatio) -10;
    const height = ((endHour - startHour) * hourHeight) + ((endMinute - startMinute) * minuteRatio);
    
    return { 
      top: top,
      height: height
    };
  };

  return (
    <Box sx={{ display: 'flex', overflow: 'auto', maxHeight: '80vh' }}>
      {/* Time labels column */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ height: '50px' }} /> {/* Empty corner */}
        {Array.from({ length: END_TIME - START_TIME + 1 }, (_, i) => (
          <Box 
            key={i} 
            sx={{ 
              position: 'absolute', 
              top: `${50 + (i * 57) - 10}px`, 
              width: '80px', 
              textAlign: 'right', 
              paddingRight: 1,
              zIndex: 1
            }}
          >
            <Typography variant="body2">{getTimeString(START_TIME + i)}</Typography>
          </Box>
        ))}
        {/* Placeholder boxes to maintain column width */}
        {Array.from({ length: END_TIME - START_TIME }, (_, i) => (
          <Box key={i} sx={{ height: '57px', width: '80px' }} />
        ))}
      </Box>

      {/* Days columns */}
      {DAYS.map((day) => (
        <Box key={day} sx={{ flex: 1, position: 'relative' }}>
          <DayHeader>
            <Typography variant="body1">{day}</Typography>
          </DayHeader>
          {/* Time slots grid */}
          {Array.from({ length: END_TIME - START_TIME }, (_, i) => (
            <TimeSlot key={i} />
          ))}
          
          {/* Class blocks rendered on top of the grid */}
          {roomClasses
            .filter(c => c.days.includes(day))
            .map((classItem) => {
              const { top, height } = getClassPosition(classItem);
              return (
                <ClassBlock
                  key={classItem.id}
                  sx={{
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {classItem.courseCode} {classItem.courseNumber}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {classItem.instructor}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {classItem.startTime} - {classItem.endTime}
                  </Typography>
                </ClassBlock>
              );
            })}
        </Box>
      ))}
    </Box>
  );
};

export default RoomCalendarView;
