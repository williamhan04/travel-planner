const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Function to get the access token from Amadeus API
async function getAccessToken() {
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY,   // Your Amadeus API Key
      client_secret: process.env.AMADEUS_API_SECRET  // Your Amadeus API Secret
    });

    const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data.access_token;  // Return the access token
  } catch (error) {
    console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    throw new Error('Unable to get access token');
  }
}

// Example flight search route
app.get('/api/flights/search', async (req, res) => {
  try {
    // Extract query parameters from the request
    const { origin, destination, departureDate, returnDate } = req.query;
    
    // Log the received parameters for debugging
    console.log("Received parameters:", { origin, destination, departureDate, returnDate });

    // Validate the input parameters
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'Missing required query parameters: origin, destination, and departureDate' });
    }

    // Get the access token from Amadeus API
    const accessToken = await getAccessToken();

    // Define the request parameters
    const params = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: 1,
    };

    // Add return date if it's a round trip
    if (returnDate) {
      params.returnDate = returnDate;
    }

    // Log the parameters being sent to Amadeus for debugging
    console.log("Sending request to Amadeus with params:", params);

    // Send request to Amadeus API
    const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    // Log the response from Amadeus for debugging
    console.log("Amadeus API Response:", JSON.stringify(response.data, null, 2));


    // Check if no flights are found
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      return res.status(404).json({ error: 'No flights found for the given criteria' });
    }

    // Send response back to client with the flight data
    res.json(response.data);
  } catch (error) {
    // Handle errors and send error response
    console.error('Error fetching flight data:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching flight data' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
