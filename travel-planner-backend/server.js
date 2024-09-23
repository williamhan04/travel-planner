"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
dotenv.config(); // Load .env variables
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Amadeus API Credentials from .env
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
// Function to get the access token from Amadeus API
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const params = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: AMADEUS_API_KEY,
                client_secret: AMADEUS_API_SECRET,
            });
            const response = yield axios_1.default.post('https://test.api.amadeus.com/v1/security/oauth2/token', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data.access_token; // Return the access token
        }
        catch (error) {
            console.error('Error fetching access token:', error.response ? error.response.data : error.message);
            throw new Error('Unable to get access token');
        }
    });
}
// Route for flight search (one-way)
app.get('/api/flights/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { origin, destination, departureDate } = req.query;
    // Check if required query parameters are provided
    if (!origin || !destination || !departureDate) {
        return res.status(400).json({ error: 'Missing required query parameters: origin, destination, and departureDate' });
    }
    try {
        const accessToken = yield getAccessToken();
        // Prepare parameters for Amadeus API request
        const params = {
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            adults: 1, // Default to 1 adult
        };
        // Call Amadeus API for flight offers and cast the response type
        const response = yield axios_1.default.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
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
    }
    catch (error) {
        console.error('Error fetching flight data:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error fetching flight data' });
    }
}));
// Route for airport suggestions (autocomplete)
app.get('/api/airports/suggest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword } = req.query;
    if (!keyword) {
        return res.status(400).json({ error: 'Missing required query parameter: keyword' });
    }
    try {
        const accessToken = yield getAccessToken();
        // Call Amadeus API for airport suggestions and cast the response type
        const response = yield axios_1.default.get('https://test.api.amadeus.com/v1/reference-data/locations', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                subType: 'AIRPORT',
                keyword: keyword,
                'page[limit]': 5, // Limit results to 5
            },
        });
        // Send airport data back to the client
        res.json(response.data);
    }
    catch (error) {
        console.error('Error fetching airport suggestions:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error fetching airport suggestions' });
    }
}));
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
