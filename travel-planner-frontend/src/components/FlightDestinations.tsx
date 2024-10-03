import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Button, Modal, Form, Pagination } from 'react-bootstrap';
import { FlightOffer } from './../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
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

  return (
    <>
      <Row className="justify-content-center mt-4">
        <Col md={4} className="text-center">
          <Form.Group>
            <Form.Label className="text-xl font-semibold text-blue-700">Sort Flights By:</Form.Label>
            <select
              className="form-control mt-2 p-2 rounded-lg border-gray-300 shadow-md transition duration-300 ease-in-out focus:border-blue-500"
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value="priceAsc">Price (Low to High)</option>
              <option value="priceDesc">Price (High to Low)</option>
            </select>
          </Form.Group>
        </Col>
      </Row>

      {currentFlights.length > 0 ? (
        <Row className="justify-content-center mt-8 gap-8">
          {currentFlights.map((flight) => {
            const uniqueKey = flight.id || uuidv4();
            const itinerary = flight.itineraries[0];
            const departure = itinerary?.segments[0]?.departure;
            const arrival = itinerary?.segments[itinerary.segments.length - 1]?.arrival;

            return (
              <Col key={uniqueKey} md={4} className="mb-6">
                <Card className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 hover:shadow-3xl hover:scale-105">
                  <Card.Body className="p-8 text-black">
                    <Card.Title className="text-3xl font-bold text-center">
                      {departure?.iataCode} → {arrival?.iataCode}
                    </Card.Title>
                    <Card.Text className="mt-6 text-lg text-center">
                      <strong>Price:</strong> {flight.price.total} {flight.price.currency}<br />
                      <strong>Departure:</strong> {departure?.at ? new Date(departure.at).toLocaleString() : 'N/A'}<br />
                      <strong>Arrival:</strong> {arrival?.at ? new Date(arrival.at).toLocaleString() : 'N/A'}
                    </Card.Text>
                    <Button
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-full mt-6 shadow-lg transition-transform duration-300 transform hover:scale-105 block mx-auto"
                      onClick={() => {
                        setSelectedFlight(flight);
                        setShowModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <p className="text-center text-2xl text-gray-600 mt-12">No flights available.</p>
      )}

      {totalPages > 1 && (
        <Pagination className="justify-content-center mt-8 gap-3">
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item
              key={`page-${i + 1}`}
              className={`px-5 py-3 rounded-lg transition-all duration-300 ${i + 1 === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-400 hover:text-white'}`}
              active={i + 1 === currentPage}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      )}

      {selectedFlight && (
        <Modal show={showModal} onHide={() => setShowModal(false)} className="flight-modal">
          <Modal.Header closeButton>
            <Modal.Title className="text-blue-500 font-semibold">Flight Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedFlight.itineraries[0]?.segments?.map((segment, index) => (
              <div key={`${selectedFlight.id}-${index}`} className="mb-6">
                <h5 className="text-xl font-bold text-gray-800">Segment {index + 1}</h5>
                <p className="text-gray-600">
                  <strong>Airline:</strong> {segment.carrierCode}<br />
                  <strong>Flight Number:</strong> {segment.number}<br />
                  <strong>Departure:</strong> {new Date(segment.departure.at).toLocaleString()} from {segment.departure.iataCode}<br />
                  <strong>Arrival:</strong> {new Date(segment.arrival.at).toLocaleString()} at {segment.arrival.iataCode}
                </p>
              </div>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
              onClick={() => setShowModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default FlightDestinations;
