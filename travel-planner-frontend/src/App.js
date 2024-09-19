import React, { useState } from 'react';
import SearchForm from './SearchForm';
import FlightDestinations from './FlightDestinations';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function App() {
  // State management for search parameters, flight data, loading, and error
  const [searchParams, setSearchParams] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle search and make API call
  const handleSearch = async (params) => {
    try {
      setLoading(true);
      setError(null);

      // Make the API call to the backend to fetch flight data
      const response = await axios.get('http://localhost:5000/api/flights/search', { params });

      // Set the flight data from the response
      setFlights(response.data.data); // Assuming your API returns flight data in `data.data`
      setSearchParams(params); // Store the search params for further use if needed
      toast.success('Flights fetched successfully!');
    } catch (err) {
      setError('Error fetching flights');
      toast.error('Error fetching flights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Toast notification container for success/error messages */}
      <ToastContainer />
      <h1 className="text-center my-4">Flight Planner</h1>

      {/* Flight search form */}
      <SearchForm onSearch={handleSearch} />

      {/* Display loading state */}
      {loading && <p>Loading flights...</p>}

      {/* Display error message */}
      {error && <p className="text-danger">{error}</p>}

      {/* Show flight destinations if flights are fetched and no error/loading */}
      {searchParams && !loading && !error && <FlightDestinations flights={flights} />}
    </div>
  );
}

export default App;
