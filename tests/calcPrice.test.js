// tests/calcPrice.test.js
const { calculateTotalAmount } = require('../src/utils/calcPrice');
const { normalizeDate } = require('../src/utils/dateUtils');

describe('calculateTotalAmount', () => {
    const baseRoom = {
        precio_por_noche: 500,
        precio_por_semana: 1400,
        precio_por_mes: 6000,
    };

    function d(str) {
        return normalizeDate(str); // asume que devuelve 'YYYY-MM-DD'
    }

    test('calcula correctamente por noche para estancias cortas (< 7 días)', () => {
        const from = d('2025-01-01');
        const to   = d('2025-01-04'); // 3 noches
        const total = calculateTotalAmount('noche', baseRoom, from, to);
        // 3 * 500
        expect(total).toBe(1500);
    });

    test('calcula correctamente por semana con días extra usando semana/7', () => {
        const from = d('2025-01-01');
        const to   = d('2025-01-10'); // 9 noches
        const total = calculateTotalAmount('semana', baseRoom, from, to);
        // 1 semana (1400) + 2 días extra a 1400/7 = 200/día → 1400 + 2*200 = 1800
        expect(total).toBe(1800);
    });

    test('calcula correctamente por mes con días extra usando mes/30', () => {
        const from = d('2025-01-01');
        const to   = d('2025-02-05'); // ~35 noches
        const total = calculateTotalAmount('mes', baseRoom, from, to);
        // 1 mes (6000) + 5 días extra a 6000/30 = 200/día → 6000 + 5*200 = 7000
        expect(total).toBe(7000);
    });

    test('si el tipo no es válido, cae a cálculo por noche', () => {
        const from = d('2025-01-01');
        const to   = d('2025-01-03'); // 2 noches
        const total = calculateTotalAmount('otro', baseRoom, from, to);
        expect(total).toBe(1000);
    });

    test('si las fechas son inválidas o noches <= 0, regresa null o lanza error manejado', () => {
        const from = 'fecha-mala';
        const to   = 'tambien-mala';
        const total = calculateTotalAmount('noche', baseRoom, from, to);
        expect(total === null || Number.isNaN(total)).toBe(true);
    });
});
