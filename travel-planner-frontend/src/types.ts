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
  
  export interface Itinerary {
    segments: FlightSegment[];
    duration: string;
  }
  
  export interface Price {
    total: string;
  }
  
  export interface Flight {
    price: Price;
    itineraries: Itinerary[];
  }
  