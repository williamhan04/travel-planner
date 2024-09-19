import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Form, Button, Modal, Pagination } from 'react-bootstrap';
import { format } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function FlightDestinations({ searchParams }) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('price'); // Sort by price by default
  const [selectedFlight, setSelectedFlight] = useState(null); // For modal
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [currentPage, setCurrentPage] = useState(1);
  const flightsPerPage = 6;

  useEffect(() => {
    const fetchFlights = async () => {
      if (!searchParams) return;
      
      setLoading(true);
      setError(null);
    
      try {
        const response = await axios.get('http://localhost:5000/api/flights/search', {
          params: searchParams,
        });
    
        console.log("Fetched Flights Data:", response.data); // Log the response to debug
    
        setFlights(response.data.data);  // Make sure response.data.data contains the correct flight data
      } catch (err) {
        console.error("Error fetching flight data:", err.response ? err.response.data : err.message);
        setError('Error fetching flight data');
      } finally {
        setLoading(false);
      }
    };
      
  
    fetchFlights();
  }, [searchParams]); // fetch flights whenever searchParams change  

  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  const sortFlights = (flights) => {
    if (sortType === 'price') {
      return flights.sort((a, b) => a.price.total - b.price.total);
    }
    if (sortType === 'duration') {
      return flights.sort((a, b) => {
        const aDuration = a.itineraries[0].duration;
        const bDuration = b.itineraries[0].duration;
        return aDuration.localeCompare(bDuration);
      });
    }
    return flights;
  };

  const handleViewDetails = (flight) => {
    setSelectedFlight(flight);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedFlight(null);
    setShowModal(false);
  };

  // Pagination logic
  const indexOfLastFlight = currentPage * flightsPerPage;
  const indexOfFirstFlight = indexOfLastFlight - flightsPerPage;
  const currentFlights = flights.slice(indexOfFirstFlight, indexOfLastFlight);
  const totalPages = Math.ceil(flights.length / flightsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Container>
        <Skeleton count={5} height={200} />
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-5">{error}</Alert>;
  }

  if (flights.length === 0) {
    return <Alert variant="info" className="mt-5">No flights available for the selected criteria.</Alert>;
  }

  return (
    <Container className="mt-5">
      {/* Sort Filter */}
      <Form.Group className="mb-4">
        <Form.Label>Sort Flights By:</Form.Label>
        <Form.Control as="select" value={sortType} onChange={handleSortChange}>
          <option value="price">Price (Low to High)</option>
          <option value="duration">Duration (Shortest First)</option>
        </Form.Control>
      </Form.Group>

      <Row>
        {sortFlights(currentFlights).map((flight, index) => {
          const itinerary = flight.itineraries[0];
          const departure = itinerary.segments[0].departure;
          const arrival = itinerary.segments[0].arrival;
          const price = flight.price.total;

          return (
            <Col key={index} md={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{arrival.iataCode} → {departure.iataCode}</Card.Title>
                  <Card.Text>
                    <strong>Price:</strong> {price} EUR<br />
                    <strong>Departure:</strong> {format(new Date(departure.at), 'PPP')}<br />
                    <strong>Arrival:</strong> {format(new Date(arrival.at), 'PPP')}
                  </Card.Text>
                  <Button variant="primary" onClick={() => handleViewDetails(flight)}>View Details</Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Pagination */}
      <Pagination className="justify-content-center">
        {[...Array(totalPages)].map((_, i) => (
          <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
            {i + 1}
          </Pagination.Item>
        ))}
      </Pagination>

      {/* Flight Details Modal */}
      <FlightDetailsModal
        show={showModal}
        onHide={handleCloseModal}
        flight={selectedFlight}
      />
    </Container>
  );
}

// Modal component for flight details
function FlightDetailsModal({ show, onHide, flight }) {
  if (!flight) return null;

  const itinerary = flight.itineraries[0];
  const segments = itinerary.segments;

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Flight Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {segments.map((segment, index) => (
          <div key={index}>
            <p><strong>Airline:</strong> {segment.carrierCode}</p>
            <p><strong>Flight Number:</strong> {segment.number}</p>
            <p><strong>Departure:</strong> {format(new Date(segment.departure.at), 'PPP')} from {segment.departure.iataCode}</p>
            <p><strong>Arrival:</strong> {format(new Date(segment.arrival.at), 'PPP')} at {segment.arrival.iataCode}</p>
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FlightDestinations;
