import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AppProvider } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import SemesterDetailsScreen from './screens/SemesterDetailsScreen';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AppProvider>
        <Router>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/semester/:id" element={<SemesterDetailsScreen />} />
            </Routes>
          </Container>
        </Router>
        </AppProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;