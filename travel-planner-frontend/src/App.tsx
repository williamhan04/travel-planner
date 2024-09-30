import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import SearchForm from './components/SearchForm';
import FlightDestinations from './components/FlightDestinations';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { FlightOffer, SearchParams, FlightDestination } from './../../shared/types';

function App() {
  // State management for search parameters, flight data, loading, and error
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [flights, setFlights] = useState<(FlightOffer | FlightDestination)[]>([]);

  // Function to handle search and make API call
  const handleSearch = async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);

      // Make the API call to the backend to fetch flight data
      const response = await axios.get<{ data: (FlightOffer | FlightDestination)[] }>('http://localhost:5000/api/flights/search', {
        params: {
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          ...(params.tripType === 'roundtrip' && { returnDate: params.returnDate }),
        },
      });

      // Check if response.data.data is defined and is an array
      if (response.data?.data && Array.isArray(response.data.data)) {
        setFlights(response.data.data);
        setSearchParams(params);
        toast.success('Flights fetched successfully!');
      } else {
        // Handle the case where data is not in the expected format
        setError('No flight data found in response.');
        toast.error('No flight data found in response.');
      }
    } catch (err: any) {
      // Improved error logging to help with debugging
      if (axios.isAxiosError(err)) {
        console.error('Axios error:', err.response);
        setError(`Error fetching flights: ${err.response?.data?.message || 'An unknown error occurred'}`);
      } else {
        console.error('Unexpected error:', err);
        setError('Error fetching flights: An unexpected error occurred.');
      }
      toast.error('Error fetching flights. Please check the console for more details.');
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="container mt-5">
      <ToastContainer />
      <h1 className="text-center mb-4">Flight Planner</h1>

      {/* Navigation Links */}
      <nav className="mb-4">
        <Link to="/login" className="btn btn-primary me-2">Login</Link>
        <Link to="/signup" className="btn btn-primary me-2">Signup</Link>
        <Link to="/" className="btn btn-primary me-2">Home</Link>
        <Link to="/dashboard" className="btn btn-primary me-2">Dashboard</Link>
        <LogoutButton />
      </nav> 

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected route for Dashboard */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        {/* Default route for search form */}
        <Route
          path="/"
          element={
            <>
              <SearchForm onSearch={handleSearch} />

              {loading && <p>Loading flights...</p>}
              {error && <p className="text-danger">{error}</p>}

              {searchParams && !loading && !error && (
                <>
                  {flights.length > 0 && (
                    <>
                      <h3>Flight Results:</h3>
                      <FlightDestinations flights={flights} />
                    </>
                  )}

                  {flights.length === 0 && (
                    <p>No flights found for your search criteria.</p>
                  )}
                </>
              )}
            </>
          }
        />
      </Routes>
    </div>
  );
}

// Logout Button Component with useNavigate
const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return <button className="btn btn-danger" onClick={handleLogout}>Logout</button>;
};

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
