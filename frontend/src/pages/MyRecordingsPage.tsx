import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Recording = {
  _id: string;
  title: string;
  createdAt: string;
  notes: { key: string; time: number }[];
  isPublic?: boolean;
};

export default function MyRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const fetchRecordings = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch('http://localhost:5050/api/recordings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchRecordings();
  }, [user, token, navigate, fetchRecordings]);

  const togglePublish = async (recordingId: string, currentPublicStatus: boolean) => {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5050/api/recordings/${recordingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: !currentPublicStatus }),
      });

      if (res.ok) {
        alert(currentPublicStatus ? 'Recording unpublished!' : 'Recording published!');
        fetchRecordings();
      } else {
        alert('Failed to update recording');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating recording');
    }
  };

  const deleteRecording = async (recordingId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5050/api/recordings/${recordingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        alert('Recording deleted!');
        fetchRecordings();
        setDeleteConfirm(null);
      } else {
        alert('Failed to delete recording');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting recording');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Recordings</h1>
      
      {recordings.length === 0 ? (
        <p>No recordings yet. Go to the Piano page to create some!</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {recordings.map((recording) => (
            <div
              key={recording._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: '#f9f9f9'
              }}
            >
              <h3>{recording.title}</h3>
              <p>
                Status: <strong>{recording.isPublic ? 'Public' : 'Private'}</strong>
              </p>
              <p>Created: {new Date(recording.createdAt).toLocaleString()}</p>
              
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => navigate('/player', {
                    state: {
                      recording,
                      isReplay: true
                    }
                  })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '0.5rem'
                  }}
                >
                  🎹 Play on Piano
                </button>
                
                <button
                  onClick={() => togglePublish(recording._id, recording.isPublic || false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: recording.isPublic ? '#FF9800' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '0.5rem'
                  }}
                >
                  {recording.isPublic ? 'Unpublish' : 'Publish'}
                </button>
                
                {deleteConfirm === recording._id ? (
                  <>
                    <button
                      onClick={() => deleteRecording(recording._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '0.25rem'
                      }}
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(recording._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
