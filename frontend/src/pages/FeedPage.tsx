import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Recording = {
  _id: string;
  title: string;
  createdAt: string;
  notes: { key: string; time: number }[];
  user: {
    username: string;
    name: string;
    profileImage?: string;
  };
};

export default function FeedPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5050/api/recordings/public');
      const data = await res.json();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchRecordings();
  }, [user, token, navigate, fetchRecordings]);

  const openPlayer = (recording: Recording) => {
    navigate('/player', {
      state: {
        recording,
        isReplay: true
      }
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1>Public Recordings</h1>
      </div>

      {recordings.length === 0 ? (
        <p>No public recordings found.</p>
      ) : (
        <div>
          {recordings.map((rec) => (
            <div key={rec._id} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1rem',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '1rem',
                  overflow: 'hidden',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {rec.user.profileImage ? (
                    <img 
                      src={rec.user.profileImage} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '16px', color: '#999' }}>👤</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{rec.user.name}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>@{rec.user.username}</div>
                </div>
              </div>
              
              <h3>{rec.title}</h3>
              <p style={{ color: '#666', fontSize: '0.9em' }}>
                {new Date(rec.createdAt).toLocaleString()}
              </p>
              <button
                onClick={() => openPlayer(rec)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🎹 Play Recording
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
