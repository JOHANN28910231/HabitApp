// tests/availability.controller.test.js
const { searchAvailability } = require('../src/controllers/availability.controller');

// Mock del modelo de habitaciones
jest.mock('../src/models/room.model', () => ({
    searchAvailableRooms: jest.fn(),
}));

const { searchAvailableRooms } = require('../src/models/room.model');

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

describe('availability.controller.searchAvailability', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('devuelve 400 si faltan from, to o guests', async () => {
        const req = { query: { destino: 'Tizimín' } };
        const res = mockRes();
        const next = jest.fn();

        await searchAvailability(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(searchAvailableRooms).not.toHaveBeenCalled();
    });

    test('devuelve 400 si la fecha de salida no es al menos 1 día después', async () => {
        const req = {
            query: {
                destino: 'Tizimín',
                from: '2025-01-10',
                to: '2025-01-10', // misma fecha
                guests: '2',
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await searchAvailability(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/al menos un día después/i);
        expect(searchAvailableRooms).not.toHaveBeenCalled();
    });

    test('devuelve 400 si guests < 1', async () => {
        const req = {
            query: {
                destino: 'Tizimín',
                from: '2025-01-10',
                to: '2025-01-12',
                guests: '0',
            },
        };
        const res = mockRes();
        const next = jest.fn();

        await searchAvailability(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/huéspedes debe ser al menos 1/i);
        expect(searchAvailableRooms).not.toHaveBeenCalled();
    });

    test('llama a searchAvailableRooms y devuelve resultados correctamente', async () => {
        const req = {
            query: {
                destino: 'Tizimín, Yucatán',
                from: '2025-01-10',
                to: '2025-01-15',
                guests: '3',
            },
        };
        const res = mockRes();
        const next = jest.fn();

        const fakeRooms = [
            {
                id_habitacion: 1,
                nombre_propiedad: 'Casa Centro',
                municipio: 'Tizimín',
                estado: 'Yucatán',
            },
        ];
        searchAvailableRooms.mockResolvedValue(fakeRooms);

        await searchAvailability(req, res, next);

        expect(res.statusCode).toBe(200);
        expect(res.body.destino).toBe('Tizimín, Yucatán');
        expect(res.body.from).toBe('2025-01-10');
        expect(res.body.to).toBe('2025-01-15');
        expect(res.body.guests).toBe(3);
        expect(res.body.total).toBe(1);
        expect(res.body.resultados).toEqual(fakeRooms);

        expect(searchAvailableRooms).toHaveBeenCalledWith({
            destino: 'Tizimín, Yucatán',
            from: '2025-01-10',
            to: '2025-01-15',
            guests: 3,
        });
    });
});
