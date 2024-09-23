import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import Autosuggest from 'react-autosuggest';
import axios from 'axios';

// Define types for props and state
interface SearchFormProps {
  onSearch: (params: { origin: string; destination: string; departureDate: string }) => void;
}

interface AirportSuggestion {
  iataCode: string;
  name: string;
}

interface FormErrors {
  origin?: string;
  destination?: string;
  departureDate?: string;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [originSuggestions, setOriginSuggestions] = useState<AirportSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AirportSuggestion[]>([]);

  const isValidIATACode = (code: string): boolean => /^[A-Z]{3}$/.test(code);

  // Fetch suggestions for origin 
  const fetchOriginSuggestions = async (value: string) => {
    if (value.length < 1) return;
    try {
      const response = await axios.get('http:/localhost:5000/api/airports/suggest', {
        params: { keyword: value },
      });
      const airportSuggestions = response.data.data.map((airport: any) => ({
        iataCode: airport.iataCode,
        name: airport.name,
      }));
      setOriginSuggestions(airportSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Fetch suggestions for destination
  const fetchDestinationSuggestions = async (value: string) => {
    if (value.length < 1) return;
    try {
      const response = await axios.get('http://localhost:5000/api/airports/suggest', {
        params: { keyword: value },
      });
      const airportSuggestions = response.data.data.map((airport: any) => ({
        iataCode: airport.iataCode,
        name: airport.name,
      }));
      setDestinationSuggestions(airportSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const renderSuggestion = (suggestion: AirportSuggestion) => (
    <div>
      {suggestion.name} ({ suggestion.iataCode})
    </div>
  );

  const getSuggestionValue = (suggestion: AirportSuggestion) => suggestion.iataCode;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let formErrors: FormErrors = {};

    if (!isValidIATACode(origin)) {
      formErrors.origin = 'Invalid origin airport code (must be 3 letters)';
    }
    if (!isValidIATACode(destination)) {
      formErrors.destination = 'Invalid destination airport code (must be 3 letters)';
    }
    if (!departureDate) {
      formErrors.departureDate = 'Departure date is required';
    }

    if (Object.keys(formErrors).length === 0) {
      setErrors({});
      onSearch({ origin, destination, departureDate });
    } else {
      setErrors(formErrors);
    }
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setDepartureDate('');
    setErrors({});
  };

  const today = new Date().toISOString().split('T')[0];


  return (
    <Container className="mt-5">
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={4}>
            <Form.Group controlId="formOrigin">
              <Form.Label>Origin</Form.Label>
              <Autosuggest
              suggestions={originSuggestions}
              onSuggestionsFetchRequested={({ value }: { value: string }) => fetchOriginSuggestions(value)}
              onSuggestionsClearRequested={() => setOriginSuggestions([])}
              getSuggestionValue={getSuggestionValue}
              renderSuggestion={renderSuggestion}
              inputProps={{
                placeholder: 'Enter origin airport code (e.g. JFK)',
                value: origin,
                onChange: (e, { newValue }) => setOrigin(newValue.toUpperCase()),  // Updated
                style: { width: '100%' },
              }}
              onSuggestionSelected={(event, { suggestionValue }) => setOrigin(suggestionValue)}
            />
              {errors.origin && <Alert variant="danger">{errors.origin}</Alert>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formDestination">
              <Form.Label>Destination</Form.Label>
              <Autosuggest
                suggestions={destinationSuggestions}
                onSuggestionsFetchRequested={({ value }) => fetchDestinationSuggestions(value)}
                onSuggestionsClearRequested={() => setDestinationSuggestions([])}
                getSuggestionValue={getSuggestionValue}
                renderSuggestion={renderSuggestion}
                inputProps={{
                  placeholder: 'Enter destination airport code (e.g. LAX)',
                  value: destination,
                  onChange: (e, { newValue }) => setDestination(newValue.toUpperCase()),
                  style: { width: '100%' },
                }}
                onSuggestionSelected={(event, { suggestionValue }) => setDestination(suggestionValue)}
              />
              {errors.destination && <Alert variant="danger">{errors.destination}</Alert>}
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={4}>
            <Form.Group controlId="formDepartureDate">
              <Form.Label>Departure Date</Form.Label>
              <Form.Control
                type="date"
                value={departureDate}
                min={today}
                onChange={(e) => setDepartureDate(e.target.value)}
                isInvalid={!!errors.departureDate}
              />
              {errors.departureDate && <Alert variant="danger">{errors.departureDate}</Alert>}
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col>
            <Button variant="primary" type="submit">
              Search Flights
            </Button>
            <Button variant="secondary" onClick={handleClear} className="ml-2">
              Clear
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default SearchForm;