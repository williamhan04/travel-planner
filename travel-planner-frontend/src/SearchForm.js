import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

function SearchForm({ onSearch }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [tripType, setTripType] = useState('one-way'); // Default is one-way
  const [errors, setErrors] = useState({});

  const isValidIATACode = (code) => /^[A-Z]{3}$/.test(code); // Validates if the code is 3 uppercase letters

  const handleSubmit = (e) => {
    e.preventDefault();
    let formErrors = {};

    if (!isValidIATACode(origin)) {
      formErrors.origin = 'Invalid origin airport code (must be 3 uppercase letters)';
    }
    if (!isValidIATACode(destination)) {
      formErrors.destination = 'Invalid destination airport code (must be 3 uppercase letters)';
    }
    if (!departureDate) {
      formErrors.departureDate = 'Departure date is required';
    }
    if (tripType === 'round-trip' && !returnDate) {
      formErrors.returnDate = 'Return date is required for round trip';
    }
    if (tripType === 'round-trip' && returnDate && departureDate && returnDate < departureDate) {
      formErrors.returnDate = 'Return date cannot be before the departure date';
    }

    if (Object.keys(formErrors).length === 0) {
      setErrors({});
      onSearch({ origin, destination, departureDate, returnDate });
    } else {
      setErrors(formErrors);
    }
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setDepartureDate('');
    setReturnDate('');
    setTripType('one-way');
    setErrors({});
  };

  const handleFieldChange = (field, value) => {
    if (field === 'origin') {
      setOrigin(value.toUpperCase());
      if (isValidIATACode(value)) {
        setErrors((prevErrors) => ({ ...prevErrors, origin: null }));
      }
    } else if (field === 'destination') {
      setDestination(value.toUpperCase());
      if (isValidIATACode(value)) {
        setErrors((prevErrors) => ({ ...prevErrors, destination: null }));
      }
    } else if (field === 'departureDate') {
      setDepartureDate(value);
      if (value) {
        setErrors((prevErrors) => ({ ...prevErrors, departureDate: null }));
      }
    } else if (field === 'returnDate') {
      setReturnDate(value);
      if (value && value >= departureDate) {
        setErrors((prevErrors) => ({ ...prevErrors, returnDate: null }));
      }
    }
  };

  // Get today's date in the format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container className="mt-5">
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={4}>
            <Form.Group controlId="formOrigin">
              <Form.Label>Origin</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter origin airport code (e.g. JFK)"
                value={origin}
                onChange={(e) => handleFieldChange('origin', e.target.value)}
                isInvalid={!!errors.origin}
              />
              <Form.Text className="text-muted">
                Example: JFK for New York
              </Form.Text>
              {errors.origin && <Alert variant="danger">{errors.origin}</Alert>}
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formDestination">
              <Form.Label>Destination</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter destination airport code (e.g. LAX)"
                value={destination}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
                isInvalid={!!errors.destination}
              />
              <Form.Text className="text-muted">
                Example: LAX for Los Angeles
              </Form.Text>
              {errors.destination && <Alert variant="danger">{errors.destination}</Alert>}
            </Form.Group>
          </Col>
        </Row>

        {/* Trip Type (One-Way or Round Trip) */}
        <Row className="mt-3">
          <Col>
            <Form.Check
              type="radio"
              label="One-Way"
              name="tripType"
              value="one-way"
              checked={tripType === 'one-way'}
              onChange={() => setTripType('one-way')}
            />
            <Form.Check
              type="radio"
              label="Round Trip"
              name="tripType"
              value="round-trip"
              checked={tripType === 'round-trip'}
              onChange={() => setTripType('round-trip')}
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={4}>
            <Form.Group controlId="formDepartureDate">
              <Form.Label>Departure Date</Form.Label>
              <Form.Control
                type="date"
                value={departureDate}
                min={today} // Prevent selecting past dates
                onChange={(e) => handleFieldChange('departureDate', e.target.value)}
                isInvalid={!!errors.departureDate}
              />
              {errors.departureDate && <Alert variant="danger">{errors.departureDate}</Alert>}
            </Form.Group>
          </Col>

          {/* Conditionally render Return Date if Round Trip */}
          {tripType === 'round-trip' && (
            <Col md={4}>
              <Form.Group controlId="formReturnDate">
                <Form.Label>Return Date</Form.Label>
                <Form.Control
                  type="date"
                  value={returnDate}
                  min={departureDate || today} // Return date must be after the departure date
                  onChange={(e) => handleFieldChange('returnDate', e.target.value)}
                  isInvalid={!!errors.returnDate}
                />
                {errors.returnDate && <Alert variant="danger">{errors.returnDate}</Alert>}
              </Form.Group>
            </Col>
          )}
        </Row>

        <Row className="mt-3">
          <Col>
            <Button variant="primary" type="submit">Search Flights</Button>
            <Button variant="secondary" onClick={handleClear} className="ml-2">Clear</Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export default SearchForm;
