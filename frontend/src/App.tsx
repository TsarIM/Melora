import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import PianoPage from './pages/PianoPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import MyRecordingsPage from './pages/MyRecordingsPage';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/piano" element={<PianoPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-recordings" element={<MyRecordingsPage />} />
            <Route path="/player" element={<PianoPage />} />
            <Route path="/" element={<Navigate to="/piano" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
