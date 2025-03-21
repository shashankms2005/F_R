import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { name, age, email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log("Submitting form data:", formData);
    
    try {
      // Validate form data before sending
      if (!name || !age || !email || !password) {
        throw new Error('All fields are required');
      }
      
      // Convert age to number if it's a string
      const formDataToSend = {
        ...formData,
        age: parseInt(formData.age)
      };
      
      console.log("Sending request to:", 'http://localhost:5000/api/auth/register');
      console.log("With data:", formDataToSend);
      
      const response = await axios.post('http://localhost:5000/api/auth/register', formDataToSend);
      
      console.log("Response received:", response.data);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user._id);
      
      // Redirect to prompt page
      navigate('/prompt');
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Server response:", err.response.data);
        setError(err.response.data.message || 'Registration failed');
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError('No response from server. Please try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", err.message);
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={age}
              onChange={onChange}
              placeholder="Enter your age"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Create a password"
              required
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;