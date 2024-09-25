import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Pagination, Button, Modal, Form } from 'react-bootstrap';
import './../../src/FlightDestinations.css';
import { FlightOffer } from './../../../shared/types'; 

interface FlightDestinationsProps {
  flights: FlightOffer[];
}
// Helper function to convert ISO 8601 duration into readable format
const convertDuration = (isoDuration: string): string => {
  const durationRegex = /PT(\d+H)?(\d+M)?/;
  const matches = isoDuration.match(durationRegex);

  if (!matches) {
    return "Invalid duration";
  }

  const hours = matches[1] ? parseInt(matches[1].replace('H', ''), 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2].replace('M', ''), 10) : 0;

  let readableDuration = '';

  if (hours) {
    readableDuration += `${hours} hour${hours > 1 ? 's' : ''} `;
  }

  if (minutes) {
    readableDuration += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return readableDuration.trim();
};

const FlightDestinations: React.FC<FlightDestinationsProps> = ({ flights }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortedFlights, setSortedFlights] = useState<FlightOffer[]>([]); // Initialize as empty array
  const [sortType, setSortType] = useState<string>('priceAsc');

  const flightsPerPage = 6;
  const indexOfLastFlight = currentPage * flightsPerPage;
  const indexOfFirstFlight = indexOfLastFlight - flightsPerPage;
  const currentFlights = sortedFlights.slice(indexOfFirstFlight, indexOfLastFlight);
  const totalPages = Math.ceil(sortedFlights.length / flightsPerPage);

  useEffect(() => {
    sortFlights(); // Sort flights whenever flights data or sortType changes
  }, [flights, sortType]);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleViewDetails = (flight: FlightOffer) => {
    setSelectedFlight(flight);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedFlight(null);
    setShowModal(false);
  };
 
  const sortFlights = () => {
    let sortedArray = [...flights];
    if (sortType === 'priceAsc') {
      sortedArray.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
    } else if (sortType === 'priceDesc') {
      sortedArray.sort((a, b) => parseFloat(b.price.total) - parseFloat(a.price.total));
    } else if (sortType === 'durationAsc') {
      sortedArray.sort((a, b) => a.itineraries[0].duration.localeCompare(b.itineraries[0].duration));
    } else if (sortType === 'durationDesc') {
      sortedArray.sort((a, b) => b.itineraries[0].duration.localeCompare(a.itineraries[0].duration));
    }
    setSortedFlights(sortedArray);
    setCurrentPage(1); // Reset to page 1 after sorting
  };

  const handleSortChange = (e: React.ChangeEvent<any>) => {
    const target = e.target as HTMLSelectElement;  // Explicit cast
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
              <option value="durationAsc">Duration (Shortest First)</option>
              <option value="durationDesc">Duration (Longest First)</option>
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      {currentFlights.length > 0 ? (
        <>
          <Row className="justify-content-center mt-3">
            {currentFlights.map((flight, index) => {
              const itinerary = flight.itineraries[0];
              const departure = itinerary.segments[0].departure;
              const arrival = itinerary.segments[0].arrival;
              const price = flight.price.total;

              return (
                <Col key={index} md={4} className="mb-4">
                  <Card className="flight-card shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-primary">
                        {departure.iataCode} → {arrival.iataCode}
                      </Card.Title>
                      <Card.Text>
                        <strong className="text-muted">Price:</strong> <span className="text-success">{price} EUR</span><br />
                        <strong className="text-muted">Departure:</strong> {new Date(departure.at).toLocaleString()}<br />
                        <strong className="text-muted">Arrival:</strong> {new Date(arrival.at).toLocaleString()}<br />
                        <strong className="text-muted">Duration:</strong> {convertDuration(itinerary.duration)}
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
          {selectedFlight && (
            <Modal show={showModal} onHide={handleCloseModal} className="flight-modal">
              <Modal.Header closeButton>
                <Modal.Title className="text-info">Flight Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedFlight.itineraries[0].segments.map((segment, index) => (
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
      ) : (
        <p>No flights available.</p>
      )}
    </>
  );
};

export default FlightDestinations;
