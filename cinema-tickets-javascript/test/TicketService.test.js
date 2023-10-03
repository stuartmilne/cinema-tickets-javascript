import TicketService from '../src/pairtest/TicketService.js';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

describe('TicketService', () => {
  let ticketService;
  let paymentService;
  let reservationService;

  beforeEach(() => {
    paymentService = new TicketPaymentService();
    reservationService = new SeatReservationService();
    ticketService = new TicketService(paymentService, reservationService);
  });

  test('should handle valid ticket purchase', () => {
    const accountId = 123;
    const ticketTypes = [
      new TicketTypeRequest('ADULT', 2),
      new TicketTypeRequest('CHILD', 3),
      new TicketTypeRequest('INFANT', 1),
    ];
    const paymentSpy = jest.spyOn(paymentService, 'makePayment');
    const reservationSpy = jest.spyOn(reservationService, 'reserveSeat');
    ticketService.purchaseTickets(accountId, ...ticketTypes);
    // Total amount: 40 (2 adult * 10 + 3 child * 5), Total tickets: 6
    expect(paymentSpy).toHaveBeenCalledWith(accountId, 70);
    expect(reservationSpy).toHaveBeenCalledWith(accountId, 5);
  });

  test('should handle exceeding maximum allowed tickets', () => {
    const accountId = 123;
    const ticketTypes = [new TicketTypeRequest('ADULT', 25)];

    expect(() => ticketService.purchaseTickets(accountId, ...ticketTypes)).toThrow(InvalidPurchaseException);
  });

  test('should handle purchasing only Infant tickets without an Adult ticket', () => {
    const accountId = 123;
    const ticketTypes = [
      new TicketTypeRequest('INFANT', 2)
    ];

    expect(() => ticketService.purchaseTickets(accountId, ...ticketTypes)).toThrow(InvalidPurchaseException);
  });

  test('should handle purchasing only Children tickets without an Adult ticket', () => {
    const accountId = 123;
    const ticketTypes = [
      new TicketTypeRequest('CHILD', 2)
    ];

    expect(() => ticketService.purchaseTickets(accountId, ...ticketTypes)).toThrow(InvalidPurchaseException);
  });

  test('should handle purchasing only Children/Infant tickets without an Adult ticket', () => {
    const accountId = 123;
    const ticketTypes = [
      new TicketTypeRequest('CHILD', 2),
      new TicketTypeRequest('INFANT', 1)
    ];

    expect(() => ticketService.purchaseTickets(accountId, ...ticketTypes)).toThrow(InvalidPurchaseException);
  });
  

  test('should handle invalid ticket purchase with zero tickets', () => {
    const accountId = 123;
    const ticketTypes = [new TicketTypeRequest('CHILD', 0)];

    expect(() => ticketService.purchaseTickets(accountId, ...ticketTypes)).toThrow(InvalidPurchaseException);
  });

});
