import InvalidPurchaseException from './lib/InvalidPurchaseException';

export default class TicketService {
  #MAX_TICKETS_PER_PURCHASE = 20;
  #MIN_ADULT_TICKETS_REQUIRED = 1;

  constructor(paymentService, seatReservationService) {
    this._paymentService = paymentService;
    this._seatReservationService = seatReservationService;
  }

  _calculateTotalAmount(ticketTypeRequests) {
    const ticketPrices = {
      ADULT: 20,
      CHILD: 10,
      INFANT: 0,
    };

    return ticketTypeRequests.reduce((totalAmount, ticketTypeRequest) => {
      const ticketType = ticketTypeRequest.getTicketType();
      const numberOfTickets = ticketTypeRequest.getNoOfTickets();
      return totalAmount + ticketPrices[ticketType] * numberOfTickets;
    }, 0);
  }

  _validatePurchase(ticketTypeRequests) {
    const totalTickets = ticketTypeRequests.reduce((acc, ticketTypeRequest) => {
      return acc + ticketTypeRequest.getNoOfTickets();
    }, 0);

    if (totalTickets > this.#MAX_TICKETS_PER_PURCHASE) {
      throw new InvalidPurchaseException('Exceeded maximum number of tickets per purchase');
    }

    const adultTickets = ticketTypeRequests.find(
      (ticketTypeRequest) => ticketTypeRequest.getTicketType() === 'ADULT'
    );

    const childTickets = ticketTypeRequests.find(
      (ticketTypeRequest) => ticketTypeRequest.getTicketType() === 'CHILD'
    );

    if (!adultTickets) {
      throw new InvalidPurchaseException('At least one adult ticket is required');
    }

    if (childTickets && !adultTickets) {
      throw new InvalidPurchaseException('Child tickets cannot be purchased without an Adult ticket');
    }
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this._validatePurchase(ticketTypeRequests);

    const totalAmountToPay = this._calculateTotalAmount(ticketTypeRequests);

    try {
      this._paymentService.makePayment(accountId, totalAmountToPay);
      // Infants do not need a seat reservation, so no need to call reserveSeat for infants
      const numberOfSeatsToReserve = ticketTypeRequests
        .filter((ticketTypeRequest) => ticketTypeRequest.getTicketType() !== 'INFANT')
        .reduce((totalSeats, ticketTypeRequest) => totalSeats + ticketTypeRequest.getNoOfTickets(), 0);
      this._seatReservationService.reserveSeat(accountId, numberOfSeatsToReserve);
    } catch (error) {
      // If there is an error during payment or seat reservation, re-throw the error.
      throw error;
    }
  }
}
