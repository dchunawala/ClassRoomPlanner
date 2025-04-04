import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DebugView: React.FC = () => {
  const semesters = JSON.parse(localStorage.getItem('semesters') || '[]');
  const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
  const classes = JSON.parse(localStorage.getItem('classes') || '[]');

  return (
    <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6">Debug Info</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2">Semesters:</Typography>
        <pre style={{ margin: 0 }}>{JSON.stringify(semesters, null, 2)}</pre>
      </Box>
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2">Rooms:</Typography>
        <pre style={{ margin: 0 }}>{JSON.stringify(rooms, null, 2)}</pre>
      </Box>
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2">Classes:</Typography>
        <pre style={{ margin: 0 }}>{JSON.stringify(classes, null, 2)}</pre>
      </Box>
    </Paper>
  );
};

export default DebugView;