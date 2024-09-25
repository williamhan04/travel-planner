import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import SearchForm from './components/SearchForm';
import FlightDestinations from './components/FlightDestinations';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { FlightOffer, SearchParams } from './../../shared/types';

function App() {
  // State management for search parameters, flight data, loading, and error
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle search and make API call
  const handleSearch = async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);

      // Make the API call to the backend to fetch flight data
      const response = await axios.get<{ data: FlightOffer[] }>('http://localhost:5000/api/flights/search', {
        params: {
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
        },
      });

      // Set the flight data from the response
      setFlights(response.data.data);
      setSearchParams(params); // Store the search params for further use if needed
      toast.success('Flights fetched successfully!');
    } catch (err) {
      setError('Error fetching flights');
      toast.error('Error fetching flights.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = 'login';
  };

  return (
    <Router>
      <div className="container mt-5">
        <ToastContainer />
        <h1 className="text-center mb-4">Flight Planner</h1>

        {/* Navigation Links */}
        <nav className="mb-4">
          <a href="/login" className="btn btn-primary me-2">Login</a>
          <a href="/signup" className="btn btn-primary me-2">Signup</a>
          <a href="/" className="btn btn-primary me-2">Home</a>
          <a href="/dashboard" className="btn btn-primary me-2">Dashboard</a>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
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

                {searchParams && !loading && !error && flights.length > 0 && <FlightDestinations flights={flights} />}
                {searchParams && !loading && !error && flights.length === 0 && <p>No flights found for your search criteria.</p>}
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;