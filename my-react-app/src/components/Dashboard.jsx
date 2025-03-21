import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Prompt() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/user', {
          headers: {
            'x-auth-token': token,
          },
        });
        setUserData(response.data);
        setLoading(false);
      } catch (err) {
        // If error, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };


  const handleAccessKnownPersons = async () => {
    const userId = localStorage.getItem('userId'); // Get userId from localStorage
    const token = localStorage.getItem('token');
    console.log(userId);

    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    try {
      // Change the URL to include the correct base URL (http://localhost:5000)
      const response = await axios.post('http://localhost:5000/api/update-known-persons', 
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token, // Include auth token if needed
          }
        }
      );

      if (response.status === 200) {
        alert('Known persons updated successfully!');
      } else {
        alert('Failed to update known persons.');
      }
    } catch (error) {
      console.error('Error updating known persons:', error);
      alert(`An error occurred: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="prompt-container">
      <div className="prompt-header">
        <h2>Welcome</h2>
        <button onClick={handleLogout} className="logout-button">Logout</button>
        <button onClick={()=>navigate('/prompt')} className="logout-button">Prompt</button>
      </div>

      <div className="prompt-card">
        <div className="user-avatar">
          {userData.name.charAt(0).toUpperCase()}
        </div>

        <div className="user-info">
          <h3>{userData.name}</h3>
          <p className="user-email">{userData.email}</p>

          <div className="user-details">
            <div className="detail-item">
              <span className="detail-label">Age</span>
              <span className="detail-value">{userData.age}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">User ID</span>
              <span className="detail-value id-value">{userData._id}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Account Created</span>
              <span className="detail-value">
                {new Date(userData.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleAccessKnownPersons} className="access-known-persons-button">
        Access Known Persons
      </button>
    </div>
  );
}

export default Prompt;