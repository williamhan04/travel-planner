import "reflect-metadata";
import { DataSource } from "typeorm";
import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import { User } from "./entity/User";
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import jwt from 'jsonwebtoken'; // Import jsonwebtoken for JWT
import { FlightOffer, RoundTripOffer, FlightOffersResponse, AirportSuggestionsResponse, CountryCurrencyMapping, FlightDestination, UnifiedFlight } from './../../shared/types';
import fs, { access } from 'fs';
import path from 'path';
import csv from 'csv-parser';

dotenv.config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Amadeus API Credentials from .env
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY as string;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET as string;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Set a JWT secret from .env or default

// Map countries to currencies
const countryCurrencyMap: Record<string, string> = {};

// Load and parse the CSV file at startup
const loadCountryCurrencyMapping = () => {
  const filePath = path.join(__dirname, '..' , 'country-code-to-currency-code-mapping.csv');

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row: CountryCurrencyMapping) => {
      countryCurrencyMap[row.CountryCode] = row.Code;
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
    });
};

// Call the load function when the server starts
loadCountryCurrencyMapping();

app.set('trust proxy', true); // Trust the 'X-Forwarded-For' header

// Route to detect user location by IP and return currency
app.get('/api/currency-by-location', async (req: Request, res: Response) => {
  try {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (typeof ip === 'string') {
      ip = ip.replace(/^::ffff:/, ''); // Remove the IPv4-mapped prefix if present
    }
    
    // Handle the case where x-forwarded-for may contain multiple IPs (comma-separated)
    if (typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim(); // Take the first IP, which is the client’s real IP
    }
    // If the IP is local (like '::1' for IPv6 localhost or '127.0.0.1' for IPv4), use a public IP for testing
    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '8.8.8.8'; // Use a public IP like Google's DNS for testing purposes
    }
    console.log(`IP Address being sent to IPInfo: ${ip}`); 

    const IPINFO_TOKEN = process.env.IPINFO_TOKEN;
    
    if (!IPINFO_TOKEN) {
      throw new Error('IPInfo token is missing from environment variables.');
    }

    // Use IP geolocation API to get user's country
    const geoResponse = await axios.get(`https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`);

    console.log('GeoResponse:', geoResponse.data);

    const { country } = (geoResponse.data as {country: string});
    console.log('Country code:', country);

    // Get currency from the mapping
    const currencyCode = countryCurrencyMap[country] || 'USD'
    console.log('Currency Code:', currencyCode);

    res.json({ currency: currencyCode });
  } catch (error) {
    console.error('Error fetching currency by location', error);
    res.status(500).json({ error: 'Error fetching currency' });
  }
});

// Set up a new DataSource instance for database connection
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  synchronize: true,
  logging: false,
});

// Initialize the DataSource
AppDataSource.initialize()
  .then(async () => {
    const userRepository = AppDataSource.getRepository(User);

    // Route to create a new user (Signup)
    app.post('/signup', async (req: Request, res: Response) => {
      const { name, email, password } = req.body;
      try {
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create a new user instance with hashed password
        const newUser = userRepository.create({ name, email, password: hashedPassword });
        await userRepository.save(newUser);
        
        // Generate JWT token after successful signup
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
        res.json({ token });
      } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Error during signup' });
      }
    });

    // Route for user login
    app.post('/login', async (req: Request, res: Response) => {
      const { email, password } = req.body;
      try {
        // Find the user by email
        const user = await userRepository.findOneBy({ email });
        if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token if login is successful
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        res.json({ token });
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login' });
      }
    });

    // Route to get all users (optional, depending on your requirements)
    app.get("/users", async (req: Request, res: Response) => {
      const users = await userRepository.find();
      res.send(users);
    });

    // Start the server after successful connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log("Error initializing database connection:", error));

  app.get('/api/flights/search', async (req: Request, res: Response) => {
    const { origin, destination, departureDate, returnDate = undefined } = req.query as {
      origin?: string;
      destination?: string;
      departureDate?: string;
      returnDate?: string;
    };
  
    // Ensure required parameters are provided
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'Missing required query parameters: origin, destination, and departureDate' });
    }
  
    try {
      const accessToken = await getAccessToken();
  
      // Step 1: Fetch one-way flight offers for the outbound flight
      const outboundParams = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults: 1, // You can adjust this as needed
      };
  
      const outboundResponse = await axios.get<FlightOffersResponse>(
        'https://test.api.amadeus.com/v2/shopping/flight-offers', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: outboundParams,
        }
      );
  
      if (!outboundResponse.data?.data?.length) {
        return res.status(404).json({ error: 'No outbound flights found for the given criteria' });
      }
  
      let mergedFlightData: UnifiedFlight[] = [];
  
      // Step 2: Fetch return flight destinations if a return date is provided
      if (returnDate) {
        const returnParams = {
          origin: destination,
          departureDate: returnDate,
        };
  
        const returnResponse = await axios.get<{ data: FlightDestination[] }>(
          'https://test.api.amadeus.com/v1/shopping/flight-destinations', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: returnParams,
          }
        );
  
        if (!returnResponse.data?.data?.length) {
          return res.status(404).json({ error: 'No return destinations found for the given criteria' });
        }
  
        // Merging outbound and return details into a unified response format
        mergedFlightData = outboundResponse.data.data.map((flightOffer) => {
          const returnOption = returnResponse.data.data.find((ret: FlightDestination) =>
            ret.destination === flightOffer.itineraries[0].segments[0].departure.iataCode
          );
  
          return {
            type: 'roundtrip-offer',
            outbound: flightOffer, // Use the entire `FlightOffer` object here
            return: returnOption || null,
          } as RoundTripOffer;
        });
  
      } else {
        // If no return date is provided, just return the outbound flights as one-way offers
        mergedFlightData = outboundResponse.data.data.map((flightOffer) => ({
          ...flightOffer,
          type: 'oneway-offer',
          links: {
            flightDates: '', // Placeholder links, you can add actual links if available
            flightOffers: '', // Placeholder links, you can add actual links if available
          }
        }));
      }
  
      res.json({ data: mergedFlightData });
    } catch (error: any) {
      console.error('Error fetching flight data:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error fetching flight data' });
    }
  });
  

// Airport suggestions route
app.get('/api/airports/suggest', async (req: Request, res: Response) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing required query parameter: keyword' });
  }

  try {
    const accessToken = await getAccessToken();

    const response = await axios.get<AirportSuggestionsResponse>('https://test.api.amadeus.com/v1/reference-data/locations', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        subType: 'AIRPORT',
        keyword: keyword as string,
        'page[limit]': 5,
      },
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching airport suggestions:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching airport suggestions' });
  }
});

// Function to get the access token from Amadeus API (unchanged)
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

    return response.data.access_token;
  } catch (error: any) {
    console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    throw new Error('Unable to get access token');
  }
}
