import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Add this line

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true }); // Add navigation after logout
  };

  const navLinkStyle = {
    padding: '8px 16px',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    marginRight: '0.5rem',
    backgroundColor: 'transparent',
    transition: 'background-color 0.3s'
  };

  const activeNavLinkStyle = {
    ...navLinkStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  };

  const navbarStyle = {
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
    backgroundColor: '#2196F3',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  if (!user) return null;

  return (
    <nav style={navbarStyle}>
      <Link to="/piano" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Piano App
      </Link>
      <div>
        <Link 
          to="/piano" 
          style={location.pathname === '/piano' ? activeNavLinkStyle : navLinkStyle}
        >
          🎹 Piano
        </Link>
        <Link 
          to="/feed" 
          style={location.pathname === '/feed' ? activeNavLinkStyle : navLinkStyle}
        >
          🌐 Public Feed
        </Link>
        <Link 
          to="/profile" 
          style={location.pathname === '/profile' ? activeNavLinkStyle : navLinkStyle}
        >
          👤 Profile
        </Link>
        <Link 
          to="/my-recordings" 
          style={location.pathname === '/my-recordings' ? activeNavLinkStyle : navLinkStyle}
        >
          🎵 My Recordings
        </Link>
        <button
          onClick={handleLogout} // Changed from logout to handleLogout
          style={{
            ...navLinkStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
