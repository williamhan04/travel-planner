import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Pagination, Button, Modal, Form } from 'react-bootstrap';
import { FlightOffer } from './../../../shared/types';
import { v4 as uuidv4 } from 'uuid'; // Import uuid to generate unique keys
import './../../src/FlightDestinations.css';

interface FlightDestinationsProps {
  flights: FlightOffer[];
}

const FlightDestinations: React.FC<FlightDestinationsProps> = ({ flights }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortType, setSortType] = useState<string>('priceAsc');

  const flightsPerPage = 6;

  // Sort flights based on price
  const sortedFlights = useCallback(() => {
    const sortedArray = [...flights];
    sortedArray.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
    return sortType === 'priceAsc' ? sortedArray : sortedArray.reverse();
  }, [flights, sortType]);

  // Paginate flights
  const currentFlights = sortedFlights().slice((currentPage - 1) * flightsPerPage, currentPage * flightsPerPage);
  const totalPages = Math.ceil(flights.length / flightsPerPage);

  // Handle pagination
  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);
  // Handle flight details view
  const handleViewDetails = (flight: FlightOffer) => {
    setSelectedFlight(flight);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setSelectedFlight(null);
    setShowModal(false);
  };

  // Handle sort selection change
<<<<<<< HEAD
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortType(e.target.value);
=======
  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLSelectElement;
    setSortType(target.value);
>>>>>>> 3c309562c55c035f41887ad47537dd8d37c2ca19
  };

  return (
    <>
      <Row className="justify-content-center mt-4">
        <Col md={4} className="text-center">
          <Form.Group>
            <Form.Label>Sort Flights By:</Form.Label>
            <select className="form-control" value={sortType} onChange={(e) => setSortType(e.target.value)}>
              <option value="priceAsc">Price (Low to High)</option>
              <option value="priceDesc">Price (High to Low)</option>
            </select>
          </Form.Group>
        </Col>
      </Row>

      {currentFlights.length > 0 ? (
        <Row className="justify-content-center mt-3">
          {currentFlights.map((flight) => {
            const uniqueKey = flight.id || uuidv4();
            const itinerary = flight.itineraries[0];
            const departure = itinerary?.segments[0]?.departure;
            const arrival = itinerary?.segments[itinerary.segments.length - 1]?.arrival;

            return (
              <Col key={uniqueKey} md={4} className="mb-4">
                <Card className="flight-card shadow-sm">
                  <Card.Body>
                    <Card.Title className="text-primary">
                      {departure?.iataCode} → {arrival?.iataCode}
                    </Card.Title>
                    <Card.Text>
                      <strong>Price:</strong> {flight.price.total} {flight.price.currency}<br />
                      <strong>Departure:</strong> {departure?.at ? new Date(departure.at).toLocaleString() : 'N/A'}<br />
                      <strong>Arrival:</strong> {arrival?.at ? new Date(arrival.at).toLocaleString() : 'N/A'}
                    </Card.Text>
                    <Button variant="info" onClick={() => handleViewDetails(flight)}>
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <p>No flights available.</p>
      )}

      {totalPages > 1 && (
        <Pagination className="justify-content-center mt-4">
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item key={`page-${i + 1}`} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
              {i + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      )}

      {/* Modal for Flight Details */}
      {selectedFlight && (
        <Modal show={showModal} onHide={handleCloseModal} className="flight-modal">
          <Modal.Header closeButton>
            <Modal.Title className="text-info">Flight Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedFlight.itineraries[0]?.segments?.map((segment) => (
              <div key={`${selectedFlight.id}-${segment.number}`} className="mb-3">
                <h5 className="text-primary">Segment {segment.number}</h5>
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
