import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import pianoKeys from '../utils/pianoKeys';
import { playNote } from '../utils/audio';

type NoteEvent = {
  key: string;
  time: number;
};

type Recording = {
  _id: string;
  title: string;
  createdAt: string;
  notes: { key: string; time: number }[];
  isPublic?: boolean;
  user?: {
    username: string;
    name: string;
    profileImage?: string;
  };
};

export default function PianoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Get recording data from navigation state
  const recording = location.state?.recording as Recording;
  const isReplayMode = location.state?.isReplay || false;

  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<NoteEvent[]>([]);
  const [showStoppedControls, setShowStoppedControls] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [currentTimeouts, setCurrentTimeouts] = useState<NodeJS.Timeout[]>([]);

  const startTime = useRef(0);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
  }, [user, token, navigate]);

  const addActiveKey = useCallback((key: string) => {
    setActiveKeys(prev => new Set(prev).add(key));
    setTimeout(() => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 200);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    playNote(key);
    addActiveKey(key);

    if (isRecording) {
      const now = performance.now();
      setRecordedNotes((prev) => [...prev, { key, time: now - startTime.current }]);
    }
  }, [isRecording, addActiveKey]);

  const startRecording = () => {
    setRecordedNotes([]);
    startTime.current = performance.now();
    setIsRecording(true);
    setShowStoppedControls(false);
    setShowSaveForm(false);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setShowStoppedControls(true);
  };

  const stopPlayback = useCallback(() => {
    currentTimeouts.forEach(timeout => clearTimeout(timeout));
    setCurrentTimeouts([]);
    setActiveKeys(new Set());
    setIsPlaying(false);
  }, [currentTimeouts]);

  const playRecording = (notes: NoteEvent[] = recordedNotes) => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    const timeouts: NodeJS.Timeout[] = [];

    notes.forEach(({ key, time }) => {
      const timeout = setTimeout(() => {
        playNote(key);
        addActiveKey(key);
      }, time);
      timeouts.push(timeout);
    });

    setCurrentTimeouts(timeouts);

    const maxTime = Math.max(...notes.map(note => note.time));
    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
      setCurrentTimeouts([]);
    }, maxTime + 500);

    timeouts.push(endTimeout);
  };

  const handleDelete = () => {
    setRecordedNotes([]);
    setTitle('');
    setShowStoppedControls(false);
    setIsRecording(false);
    setShowSaveForm(false);
  };

  const showSaveFormHandler = () => {
    setShowSaveForm(true);
  };

  const cancelSave = () => {
    setShowSaveForm(false);
    setTitle('');
  };

  const handleSave = async (isPublic = false) => {
    if (!token) return;

    const payload = {
      title,
      notes: recordedNotes,
      isPublic
    };

    try {
      const res = await fetch('http://localhost:5050/api/recordings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Recording saved${isPublic ? ' and published' : ''}!`);
        setTitle('');
        setRecordedNotes([]);
        setShowStoppedControls(false);
        setIsRecording(false);
        setShowSaveForm(false);
      } else {
        const error = await res.json();
        alert('Failed to save recording: ' + error.error);
      }
    } catch (error) {
      console.error(error);
      alert('Error saving recording.');
    }
  };

  // Key press listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused) return;
      const key = e.key.toLowerCase();
      if (pianoKeys.includes(key)) {
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isInputFocused, handleKeyPress]);

  const renderButtonPanel = () => {
    // If in replay mode (from feed), show replay controls
    if (isReplayMode && recording) {
      return (
        <button
          onClick={() => playRecording(recording.notes)}
          style={{
            padding: '8px 16px',
            backgroundColor: isPlaying ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? '⏹️ Stop' : '▶️ Play Recording'}
        </button>
      );
    }

    // Regular recording mode controls
    if (isRecording) {
      return (
        <button 
          onClick={stopRecording}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Stop
        </button>
      );
    } else if (showSaveForm) {
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <input
            type="text"
            placeholder="Enter recording title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={{ padding: '0.5rem', margin: '0 0.5rem' }}
            autoFocus
          />
          <button 
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Save Private
          </button>
          <button 
            type="button"
            onClick={() => handleSave(true)}
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
            Save & Publish
          </button>
          <button 
            type="button"
            onClick={cancelSave}
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
        </form>
      );
    } else if (showStoppedControls) {
      return (
        <>
          <button 
            onClick={() => playRecording()} 
            disabled={recordedNotes.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: recordedNotes.length === 0 ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: recordedNotes.length === 0 ? 'not-allowed' : 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Preview
          </button>
          <button 
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Delete
          </button>
          <button 
            onClick={showSaveFormHandler}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </>
      );
    } else {
      return (
        <button 
          onClick={startRecording}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Record
        </button>
      );
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        {isReplayMode && recording ? (
          <h1>Playing: {recording.title}</h1>
        ) : (
          <h1>Piano</h1>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        {renderButtonPanel()}
      </div>

      {/* Piano Keys */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {pianoKeys.map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            style={{
              padding: '2rem 1rem',
              backgroundColor: activeKeys.has(key) ? '#FFD700' : '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: '50px',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
