import "reflect-metadata";
import { DataSource } from "typeorm";
import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import { User } from "./entity/User";
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import jwt from 'jsonwebtoken'; // Import jsonwebtoken for JWT
import { FlightOffersResponse, AirportSuggestionsResponse } from './../../shared/types';

dotenv.config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Amadeus API Credentials from .env
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY as string;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET as string;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Set a JWT secret from .env or default

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

// Amadeus API and Flight Search Routes 
app.get('/api/flights/search', async (req: Request, res: Response) => {
  const { origin, destination, departureDate } = req.query;

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: 'Missing required query parameters: origin, destination, and departureDate' });
  }

  try {
    const accessToken = await getAccessToken();

    const params = {
      originLocationCode: origin as string,
      destinationLocationCode: destination as string,
      departureDate: departureDate as string,
      adults: 1,
    };

    const response = await axios.get<FlightOffersResponse>('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });

    if (!response.data || response.data.data.length === 0) {
      return res.status(404).json({ error: 'No flights found for the given criteria' });
    }

    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching flight data:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error fetching flight data' });
  }
});

// Airport suggestions route (unchanged)
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
