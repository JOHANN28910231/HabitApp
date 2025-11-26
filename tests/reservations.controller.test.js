// tests/reservations.controller.test.js
const {
    createReservation,
} = require('../src/controllers/reservations.controller');

jest.mock('../src/models/room.model', () => ({
    getRoomById: jest.fn(),
}));

jest.mock('../src/models/reservation.model', () => ({
    createReservationWithLock: jest.fn(),
}));

jest.mock('../src/utils/calcPrice', () => ({
    calculateTotalAmount: jest.fn(),
}));

const { getRoomById } = require('../src/models/room.model');
const { createReservationWithLock } = require('../src/models/reservation.model');
const { calculateTotalAmount } = require('../src/utils/calcPrice');

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

describe('reservations.controller.createReservation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('devuelve 401 si no hay req.user (no autenticado)', async () => {
        const req = {
            user: null,
            body: {},
        };
        const res = mockRes();
        const next = jest.fn();

        await createReservation(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/Debes iniciar sesión/i);
    });

    test('devuelve 400 si faltan datos requeridos', async () => {
        const req = {
            user: { id_usuario: 10 },
            body: {
                // faltan campos
                id_habitacion: 1,
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await createReservation(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Faltan datos/i);
    });

    test('devuelve 404 si la habitación no existe', async () => {
        const req = {
            user: { id_usuario: 10 },
            body: {
                id_habitacion: 999,
                fecha_inicio: '2025-01-10',
                fecha_salida: '2025-01-15',
                tipo_alojamiento: 'noche',
            },
        };
        const res = mockRes();
        const next = jest.fn();

        getRoomById.mockResolvedValue(null);

        await createReservation(req, res, next);

        expect(getRoomById).toHaveBeenCalledWith(999);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/Habitación no encontrada/i);
    });

    test('devuelve 409 si existe traslape (createReservationWithLock -> reason overlap)', async () => {
        const req = {
            user: { id_usuario: 10 },
            body: {
                id_habitacion: 1,
                fecha_inicio: '2025-01-10',
                fecha_salida: '2025-01-15',
                tipo_alojamiento: 'noche',
            },
        };
        const res = mockRes();
        const next = jest.fn();

        getRoomById.mockResolvedValue({
            id_habitacion: 1,
            precio_por_noche: 500,
        });

        calculateTotalAmount.mockReturnValue(2500);

        createReservationWithLock.mockResolvedValue({
            success: false,
            reason: 'overlap',
        });

        await createReservation(req, res, next);

        expect(createReservationWithLock).toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/fechas seleccionadas ya no están disponibles/i);
    });

    test('devuelve 201 y datos correctos cuando la reservación se crea bien', async () => {
        const req = {
            user: { id_usuario: 10 },
            body: {
                id_habitacion: 1,
                fecha_inicio: '2025-01-10',
                fecha_salida: '2025-01-15',
                tipo_alojamiento: 'noche',
            },
        };
        const res = mockRes();
        const next = jest.fn();

        getRoomById.mockResolvedValue({
            id_habitacion: 1,
            precio_por_noche: 500,
        });

        calculateTotalAmount.mockReturnValue(2500);

        createReservationWithLock.mockResolvedValue({
            success: true,
            id_reservacion: 123,
        });

        await createReservation(req, res, next);

        expect(res.statusCode).toBe(201);
        expect(res.body).toMatchObject({
            message: expect.stringMatching(/en estado en_proceso/i),
            id_reservacion: 123,
            monto_total: 2500,
        });
    });
});
