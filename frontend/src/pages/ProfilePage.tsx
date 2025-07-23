import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    name: user?.name || ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
  }, [user, token, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:5050/api/upload/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        const updatedUser = { ...user!, profileImage: data.imageUrl };
        updateUser(updatedUser);
        setSelectedImage(null);
        alert('Profile image updated successfully!');
      } else {
        alert('Failed to upload image: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5050/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        const updatedUser = { ...user!, ...formData };
        updateUser(updatedUser);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + data.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Profile</h1>

      {/* Profile Image Section */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          margin: '0 auto',
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {user.profileImage || user.picture ? (
            <img 
              src={user.profileImage || user.picture} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '48px', color: '#999' }}>👤</span>
          )}
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            style={{ marginBottom: '1rem' }}
          />
          {selectedImage && (
            <div>
              <button 
                onClick={uploadImage}
                disabled={uploading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
        {!isEditing ? (
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            
            <button 
              onClick={() => setIsEditing(true)}
              style={{
                marginTop: '1rem',
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Name:</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Username:</label>
              <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '4px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div>
              <button 
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                Save Changes
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    username: user.username,
                    name: user.name
                  });
                }}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
