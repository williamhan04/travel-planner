import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Amadeus API Credentials from .env
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY as string;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET as string;

// Define types for Amadeus API responses
interface FlightOffer {
  id: string;
  price: {
    total: string;
  };
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
    }>;
    duration: string;
  }>;
}

interface FlightOffersResponse {
  data: FlightOffer[];
}

interface AirportSuggestion {
  iataCode: string;
  name: string;
}

interface AirportSuggestionsResponse {
  data: AirportSuggestion[];
}

// Function to get the access token from Amadeus API
async function getAccessToken(): Promise<string> {
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET,
    });

    const response = await axios.post<{ access_token: string }>('https://test.api.amadeus.com/v1/security/oauth2/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data.access_token; // Return the access token
  } catch (error: any) {
    console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    throw new Error('Unable to get access token');
  }
}

// Route for flight search (one-way)
app.get('/api/flights/search', async (req: Request, res: Response) => {
  const { origin, destination, departureDate } = req.query;

  // Check if required query parameters are provided
  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: 'Missing required query parameters: origin, destination, and departureDate' });
  }

  try {
    const accessToken = await getAccessToken();

    // Prepare parameters for Amadeus API request
    const params = {
      originLocationCode: origin as string,
      destinationLocationCode: destination as string,
      departureDate: departureDate as string,
      adults: 1, // Default to 1 adult
    };

    // Call Amadeus API for flight offers and cast the response type
    const response = await axios.get<FlightOffersResponse>('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    // Check if flights are found
    if (!response.data || response.data.data.length === 0) {
      return res.status(404).json({ error: 'No flights found for the given criteria' });
    }

    // Send the flight data back to the client
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching flight data:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching flight data' });
  }
});

// Route for airport suggestions (autocomplete)
app.get('/api/airports/suggest', async (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing required query parameter: keyword' });
  }

  try {
    const accessToken = await getAccessToken();

    // Call Amadeus API for airport suggestions and cast the response type
    const response = await axios.get<AirportSuggestionsResponse>('https://test.api.amadeus.com/v1/reference-data/locations', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        subType: 'AIRPORT',
        keyword: keyword as string,
        'page[limit]': 5, // Limit results to 5
      },
    });

    // Send airport data back to the client
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching airport suggestions:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching airport suggestions' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
