// tests/auth.e2e.test.js
const request = require('supertest');
require('dotenv').config({ path: '.env.test' }); // usar BD de pruebas
const app = require('../src/app');
const pool = require('../src/utils/db'); // <- importa tu pool de MySQL

describe('Auth E2E (básico)', () => {
    test('GET /api/auth/me devuelve 401 cuando no hay sesión', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .send();

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});

// Cerrar el pool de MySQL al terminar todos los tests de este archivo
afterAll(async () => {
    try {
        await pool.end();
    } catch (e) {
        // por si acaso
        console.warn('Error cerrando pool en afterAll:', e.message);
    }
});
