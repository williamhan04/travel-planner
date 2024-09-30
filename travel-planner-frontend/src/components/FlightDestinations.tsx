import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Pagination, Button, Modal, Form } from 'react-bootstrap';
import { FlightOffer, FlightDestination, RoundTripOffer, UnifiedFlight } from './../../../shared/types';
import './../../src/FlightDestinations.css';

interface FlightDestinationsProps {
  flights: UnifiedFlight[];
}

// Type guards to determine the type of flight
const isFlightOffer = (flight: UnifiedFlight): flight is FlightOffer => {
  return 'itineraries' in flight && 'id' in flight;
};

const isRoundTripOffer = (flight: UnifiedFlight): flight is RoundTripOffer => {
  return 'outbound' in flight && flight.type === 'roundtrip-offer';
};

const isFlightDestination = (flight: UnifiedFlight): flight is FlightDestination => {
  return 'departureDate' in flight && !('itineraries' in flight);
};

const FlightDestinations: React.FC<FlightDestinationsProps> = ({ flights }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedFlight, setSelectedFlight] = useState<UnifiedFlight | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortType, setSortType] = useState<string>('priceAsc');

  const flightsPerPage = 6;
  
  const sortedFlights = useCallback(() => {
    const sortedArray = [...flights];
    sortedArray.sort((a, b) => {
      const aPrice = isFlightOffer(a) || isFlightDestination(a) ? parseFloat(a.price.total) : parseFloat(a.outbound.price.total);
      const bPrice = isFlightOffer(b) || isFlightDestination(b) ? parseFloat(b.price.total) : parseFloat(b.outbound.price.total);

      return sortType === 'priceAsc' ? aPrice - bPrice : bPrice - aPrice;
    });
    return sortedArray;
  }, [flights, sortType]);

  const currentFlights = sortedFlights().slice((currentPage - 1) * flightsPerPage, currentPage * flightsPerPage);
  const totalPages = Math.ceil(flights.length / flightsPerPage);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);
  const handleViewDetails = (flight: UnifiedFlight) => {
    setSelectedFlight(flight);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setSelectedFlight(null);
    setShowModal(false);
  };
  
  const handleSortChange = (e: React.ChangeEvent<unknown>) => {
    const target = e.target as HTMLSelectElement; // Explicitly cast to HTMLSelectElement
    setSortType(target.value);
  };

  return (
    <>
      <Row className="justify-content-center mt-4">
        <Col md={4} className="text-center">
          <Form.Group>
            <Form.Label>Sort Flights By:</Form.Label>
            <Form.Control as="select" value={sortType} onChange={handleSortChange}>
              <option value="priceAsc">Price (Low to High)</option>
              <option value="priceDesc">Price (High to Low)</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      {currentFlights.length > 0 ? (
        <Row className="justify-content-center mt-3">
          {currentFlights.map((flight, index) => {
            if (isFlightOffer(flight)) {
              // Handle FlightOffer
              const itinerary = flight.itineraries?.[0];
              const departure = itinerary?.segments?.[0]?.departure;
              const arrival = itinerary?.segments?.[itinerary?.segments?.length - 1]?.arrival;
              return (
                <Col key={index} md={4} className="mb-4">
                  <Card className="flight-card shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-primary">
                        {departure?.iataCode} → {arrival?.iataCode}
                      </Card.Title>
                      <Card.Text>
                        <strong>Price:</strong> {flight.price.total} {flight.price.currency}<br />
                        <strong>Departure:</strong> {new Date(departure?.at).toLocaleString()}<br />
                        <strong>Arrival:</strong> {new Date(arrival?.at).toLocaleString()}
                      </Card.Text>
                      <Button variant="info" onClick={() => handleViewDetails(flight)}>
                        View Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            } else if (isRoundTripOffer(flight)) {
              // Handle RoundTripOffer
              return (
                <Col key={index} md={4} className="mb-4">
                  <Card className="flight-card shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-primary">
                      {flight.outbound.itineraries[0].segments[0].departure.iataCode} → {flight.outbound.itineraries[0].segments[flight.outbound.itineraries[0].segments.length - 1].arrival.iataCode}
                      </Card.Title>
                      <Card.Text>
                        <strong>Outbound Departure:</strong> {new Date(flight.outbound.itineraries[0].segments[0].departure.at).toLocaleDateString()}<br />
                        <strong>Return Departure:</strong> {flight.return?.departureDate || 'No Return'}<br />
                        <strong>Total Price:</strong> {flight.return ? flight.return.price.total : flight.outbound.price.total} {flight.outbound.price.currency}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              );
            } else if (isFlightDestination(flight)) {
              // Handle FlightDestination
              return (
                <Col key={index} md={4} className="mb-4">
                  <Card className="flight-card shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-primary">
                        {flight.origin} → {flight.destination}
                      </Card.Title>
                      <Card.Text>
                        <strong>Departure:</strong> {new Date(flight.departureDate).toLocaleDateString()}<br />
                        <strong>Return:</strong> {flight.returnDate ? new Date(flight.returnDate).toLocaleDateString() : 'One Way'}<br />
                        <strong>Price:</strong> {flight.price.total} {flight.price.currency}<br />
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              );
            }
          })}
        </Row>
      ) : (
        <p>No flights available.</p>
      )}

      {totalPages > 1 && (
        <Pagination className="justify-content-center mt-4">
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
              {i + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      )}

      {/* Modal for Flight Details */}
      {selectedFlight && isFlightOffer(selectedFlight) && selectedFlight.itineraries && (
        <Modal show={showModal} onHide={handleCloseModal} className="flight-modal">
          <Modal.Header closeButton>
            <Modal.Title className="text-info">Flight Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedFlight.itineraries[0]?.segments?.map((segment, index) => (
              <div key={index} className="mb-3">
                <h5 className="text-primary">Segment {index + 1}</h5>
                <p>
                  <strong>Airline:</strong> {segment.carrierCode}<br />
                  <strong>Flight Number:</strong> {segment.number}<br />
                  <strong>Departure:</strong> {new Date(segment.departure.at).toLocaleString()} from {segment.departure.iataCode}<br />
                  <strong>Arrival:</strong> {new Date(segment.arrival.at).toLocaleString()} at {segment.arrival.iataCode}
                </p>
              </div>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default FlightDestinations;
