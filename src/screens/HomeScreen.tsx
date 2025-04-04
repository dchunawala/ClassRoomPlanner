import React, { useState } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppContext } from '../context/AppContext';
import AddSemesterModal from '../components/AddSemesterModal';
import SemesterList from '../components/SemesterList';

const HomeScreen: React.FC = () => {
  const { semesters, rooms, classes } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const handleAddSemesterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
  };

  const starredSemesters = semesters.filter(sem => sem.isStarred).length;
  const totalRooms = rooms.length;
  const totalClasses = classes.length;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Middlesex College Classroom Scheduler
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage your semesters, rooms, and class schedules efficiently
      </Typography>

      {/* <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Starred Semesters
              </Typography>
              <Typography variant="h4">{starredSemesters}</Typography>
              <Typography variant="caption" color="text.secondary">
                Max 4 starred semesters allowed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Rooms
              </Typography>
              <Typography variant="h4">{totalRooms}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Classes
              </Typography>
              <Typography variant="h4">{totalClasses}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        <Typography variant="h5">Manage Semesters</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSemesterClick}
          sx={{
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            transition: 'transform 0.2s',
            position: 'relative',
            zIndex: 2
          }}
        >
          Add Semester
        </Button>
      </Box>

      <SemesterList />

      <Box sx={{ position: 'relative', zIndex: 1200 }}>
        <AddSemesterModal
          open={isAddModalOpen}
          onClose={handleModalClose}
        />
      </Box>
    </Box>
  );
};

export default HomeScreen;