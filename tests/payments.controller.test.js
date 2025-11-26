// tests/payments.controller.test.js
const { charge } = require('../src/controllers/payments.controller');

jest.mock('../src/models/payment.model', () => ({
    createPayment: jest.fn(),
}));

jest.mock('../src/models/reservation.model', () => ({
    getReservationById: jest.fn(),
    updateReservationStatus: jest.fn(),
}));

const { createPayment } = require('../src/models/payment.model');
const { getReservationById, updateReservationStatus } = require('../src/models/reservation.model');

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

describe('payments.controller.charge', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Controlamos Math.random para forzar "aprobado"
        jest.spyOn(Math, 'random').mockReturnValue(0.9); // >0.2 => aprobado
    });

    afterEach(() => {
        Math.random.mockRestore();
    });

    test('devuelve 400 si faltan reservation_id o amount', async () => {
        const req = { body: { reservation_id: null, amount: null } };
        const res = mockRes();

        await charge(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Faltan datos/i);
    });

    test('devuelve 404 si la reservación no existe', async () => {
        const req = {
            body: {
                reservation_id: 999,
                amount: 2500,
                card: { number: '4111111111111111', name: 'Test', exp: '12/30', cvv: '123' },
            },
        };
        const res = mockRes();

        getReservationById.mockResolvedValue(null);

        await charge(req, res);

        expect(getReservationById).toHaveBeenCalledWith(999);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/Reservación no encontrada/i);
    });

    test('si el pago se aprueba, crea pago y actualiza estado de la reserva a "reservado"', async () => {
        const req = {
            body: {
                reservation_id: 123,
                amount: 2500,
                card: { number: '4111111111111111', name: 'Test', exp: '12/30', cvv: '123' },
            },
        };
        const res = mockRes();

        getReservationById.mockResolvedValue({
            id_reservacion: 123,
            id_habitacion: 1,
            id_huesped: 10,
        });

        createPayment.mockResolvedValue({ insertId: 999 });
        updateReservationStatus.mockResolvedValue(true);

        await charge(req, res);

        expect(res.statusCode).toBe(200);
        expect(createPayment).toHaveBeenCalled();
        expect(updateReservationStatus).toHaveBeenCalledWith(123, 'reservado');
        expect(res.body).toMatchObject({
            status: 'aprobado',
            payment_id: 999,
            reservation_id: 123,
            reference: expect.stringMatching(/^SIM-/),
        });
    });
});
