// Requisitos: npm i -D mocha supertest chai
const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config({ path: '.env.test' }); // usar BD de pruebas
const app = require('../src/app');

function cookieFrom(res) {
  const header = res.headers['set-cookie'];
  return header ? header.map(c => c.split(';')[0]).join('; ') : '';
}

describe('Auth E2E', function() {
  this.timeout(5000);

  const random = Date.now();
  const testUser = { email: `test+${random}@example.com`, password: 'Pass1234!', nombre: 'Test User' };
  let sessionCookie = '';

  it('POST /api/auth/register -> 201 and set session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testUser.email, password: testUser.password, nombre: testUser.nombre });
    expect(res.status).to.be.oneOf([200, 201]);
    sessionCookie = cookieFrom(res);
    expect(sessionCookie).to.match(/habitapp\.sid|connect.sid/);
  });

  it('GET /api/auth/me -> 200 (uses session cookie)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);
    expect(res.status).to.equal(200);
    expect(res.body.user).to.have.property('email', testUser.email);
  });

  it('GET /api/users -> 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Cookie', sessionCookie);
    expect(res.status).to.equal(403);
  });

  it('POST /api/auth/login with same user -> 200 and set session cookie', async () => {
    // destroy previous session then login again
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).to.equal(200);
    const loginCookie = cookieFrom(res);
    expect(loginCookie).to.match(/habitapp\.sid|connect.sid/);
  });
});