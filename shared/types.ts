// Define the structure for flight segments
export interface FlightSegment {
  departure: {
    iataCode: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    at: string;
  };
  carrierCode: string;
  number: string;
}
export interface CountryCurrencyMapping {
  Country: string;
  CountryCode: string;
  Currency: string;
  Code: string;
}

// Define the itinerary structure, including segments and total duration
export interface Itinerary {
  segments: FlightSegment[];
  duration: string;
}

// Price structure, including the total and currency
export interface Price {
  total: string;
  currency: string; 
}

// Pricing options structure, including fare type and baggage options
export interface PricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

// Traveler pricing structure, including fare option, traveler type, and price
export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;  // e.g., 'ADULT'
  price: Price;
}

// Main flight offer structure returned by the Amadeus API
export interface FlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  disablePricing: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  paymentCardRequired: boolean;
  lastTicketingDate: string;
  lastTicketingDateTime: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface Links {
  flightDates: string;  // URL for flight dates resource
  flightOffers: string;  // URL for flight offers resource
}

export interface FlightDestination {
  type: string;  // The type of the resource, e.g., 'flight-destination'
  origin: string;  // Origin airport code (e.g., 'PAR')
  destination: string;  // Destination airport code (e.g., 'DXB')
  departureDate: string;  // Departure date in YYYY-MM-DD format
  returnDate?: string;  // Return date in YYYY-MM-DD format (optional if it's a one-way flight)
  price: Price;  // Price object with total price and currency
  links: Links;  // Links to other resources related to the flight destination
}

// Define GeoCode interface for the geographical coordinates
export interface GeoCode {
  latitude: number;
  longitude: number;
}

// Define types for search parameters
export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;  // This can be a string or a Date object depending on how you handle dates
  returnDate?: string;
  tripType: 'oneway' | 'roundtrip';
}

// Define Address interface for the location's address details
export interface Address {
  cityName: string;
  countryCode: string;
}

// Define Distance interface for the distance to the location
export interface Distance {
  value: number;
  unit: string;  // e.g., "KM" or "MI"
}

// Define Analytics interface for analytics data
export interface Analytics {
  flights: {
    score: number;
  };
  travelers: {
    score: number;
  };
}

// Define the AirportSuggestion interface for each airport/location suggestion
export interface AirportSuggestion {
  id: string;
  self: {
    href: string;  // Link to the resource
  };
  type: string;  // Resource type, e.g., "location"
  subType: string;  // Subtype, e.g., "AIRPORT"
  name: string;  // Name of the location
  detailedName: string;  // Detailed name, e.g., "Paris/FR: Charles de Gaulle"
  timeZoneOffset: string;  // Timezone offset, e.g., "+01:00"
  iataCode: string;  // IATA code, e.g., "CDG"
  geoCode: GeoCode;  // Geographical coordinates
  address: Address;  // Address details
  distance: Distance;  // Distance to the location
  analytics: Analytics;  // Analytics data, e.g., flight or traveler scores
  relevance: number;  // Relevance score, e.g., 9.6584
  category: string;  // Category of the location, e.g., "HISTORICAL"
  tags?: string[];  // Optional array of tags
  rank: string;  // Rank, e.g., "1"
}

// Define the main response structure containing an array of airport suggestions
export interface AirportSuggestionsResponse {
  data: AirportSuggestion[];  // Array of airport suggestions
}

// The main response structure containing an array of flight offers
export interface FlightOffersResponse {
  data: FlightOffer[];  // Array of flight offers
}

// Define a RoundTripOffer type that includes outbound and return details
export interface RoundTripOffer {
  type: 'roundtrip-offer';
  outbound: FlightOffer;
  return?: FlightDestination | null;
} 

export type UnifiedFlight = FlightOffer | RoundTripOffer | FlightDestination;  