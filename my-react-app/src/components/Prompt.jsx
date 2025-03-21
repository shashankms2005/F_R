import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import "./Prompt.css";
import { useNavigate } from 'react-router-dom';

function Prompt() {
  const [knownPersons, setKnownPersons] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const navigate=useNavigate();
  // Get patient ID from localStorage
  const patientId = localStorage.getItem('userId') || '';
  console.log("prompt",patientId)

  // Fetch the list of known persons from MongoDB
  useEffect(() => {
    const fetchKnownPersons = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        console.log("Patient ID:", patientId);
        console.log("Token available:", !!token);
        
        if (!patientId || !token) {
          setError('Authentication information missing. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        console.log("Making request to:", `http://localhost:5000/api/known-persons/${patientId}`);
        
        const response = await axios.get(`http://localhost:5000/api/known-persons/${patientId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        console.log("Response received:", response.data);
        
        setKnownPersons(response.data.known_persons);
        
        if (response.data.known_persons.length > 0 && !selectedPersonId) {
          setSelectedPersonId(response.data.known_persons[0].id);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error details:', err);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
        setError('Failed to fetch known persons. Please try again later.');
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchKnownPersons();
    }
  }, [patientId, selectedPersonId]);

  // Fetch summary for a specific date
  const fetchDateSummary = async () => {
    if (!selectedPersonId) {
      setError('Please select a known person first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSummaryData(null); // Clear previous data
      
      const response = await axios.get('http://localhost:5002/api/summarize-conversation', {
        params: {
          patient_id: patientId,
          known_person_id: selectedPersonId,
          date: selectedDate
        }
      });
      
      setSummaryData(response.data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch summary. Please try again later.');
      setIsLoading(false);
      console.error('Error fetching summary:', err);
    }
  };

  // Fetch summary for all conversations
  const fetchAllSummaries = async () => {
    if (!selectedPersonId) {
      setError('Please select a known person first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSummaryData(null); // Clear previous data
      
      const response = await axios.get('http://localhost:5002/api/summarize-all-conversations', {
        params: {
          patient_id: patientId,
          known_person_id: selectedPersonId
        }
      });
      
      setSummaryData(response.data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch all summaries. Please try again later.');
      setIsLoading(false);
      console.error('Error fetching all summaries:', err);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Handle person selection
  const handlePersonChange = (e) => {
    setSelectedPersonId(e.target.value);
    // Clear previous summary data when changing person
    setSummaryData(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const handleDashboardClick = () => {
    navigate('/dashboard'); // Navigate to dashboard
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/'); // Navigate to login
  };


  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Conversation Summaries</h1>
        <div>
          <button onClick={handleDashboardClick} className="mr-4 hover:text-gray-300">Dashboard</button>
          <button onClick={handleLogoutClick} className="hover:text-gray-300">Logout</button>
        </div>
      </nav>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Selection Controls */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg shadow">
        <div className="mb-4">
          <label htmlFor="personSelect" className="block text-gray-700 mb-2 font-medium">
            Select Known Person
          </label>
          <div className="relative">
            <select
              id="personSelect"
              value={selectedPersonId}
              onChange={handlePersonChange}
              className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || knownPersons.length === 0}
            >
              <option value="">Select a person...</option>
              {knownPersons.map((person) => (
                <option key={person.known_person_id} value={person.known_person_id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="dateSelect" className="block text-gray-700 mb-2 font-medium">
            Select Date for Single Day Summary
          </label>
          <input
            type="date"
            id="dateSelect"
            value={selectedDate}
            onChange={handleDateChange}
            className="block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            max={format(new Date(), 'yyyy-MM-dd')}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={fetchDateSummary}
            disabled={isLoading || !selectedPersonId}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Get Summary for Selected Date'}
          </button>
          
          <button
            onClick={fetchAllSummaries}
            disabled={isLoading || !selectedPersonId}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Get Summary of All Conversations'}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {summaryData && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-100 p-4 border-b">
            <h2 className="text-xl font-semibold">
              {summaryData.date ? `Summary for ${formatDate(summaryData.date)}` : 'All Conversations Summary'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {summaryData.conversation_count} messages | {summaryData.conversation_length} characters
            </p>
          </div>
          
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              {summaryData.success ? (
                <div className="bg-gray-50 p-4 rounded">
                  {summaryData.summary.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-orange-600">
                  {summaryData.summary || 'No summary available'}
                </p>
              )}
            </div>
            
            {/* Messages section */}
            {summaryData.original_messages && summaryData.original_messages.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Original Messages</h3>
                <div className="overflow-auto max-h-96 border rounded">
                  {summaryData.original_messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{message.speaker}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Messages by date section (for all conversations) */}
            {summaryData.messages_by_date && Object.keys(summaryData.messages_by_date).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Messages By Date</h3>
                
                {summaryData.conversation_dates && summaryData.conversation_dates.map(date => (
                  <div key={date} className="mb-4">
                    <h4 className="font-medium text-blue-600 mb-2">
                      {formatDate(date)}
                    </h4>
                    <div className="border rounded overflow-hidden">
                      {summaryData.messages_by_date[date].map((message, index) => (
                        <div 
                          key={index} 
                          className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b`}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{message.speaker}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Loading state with no data yet */}
      {isLoading && !summaryData && (
        <div className="text-center py-12">
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !summaryData && selectedPersonId && (
        <div className="text-center py-12 bg-gray-50 border rounded-lg">
          <p className="mt-2 text-gray-600">Select options and click a button to see conversation summaries</p>
        </div>
      )}
    </div>
  );
}

export default Prompt;