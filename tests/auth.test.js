 
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
        orders: { create: jest.fn() }
    }));
});

jest.setTimeout(20000);

let mongoServer;



beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test_secret_key';

    app = require('../server');

    await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('open', resolve);
    });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('POST /signup', () => {
    it('registers a new user successfully', async () => {
        const res = await request(app)
            .post('/signup')
            .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
    });

    it('rejects duplicate email registration', async () => {
        await request(app)
            .post('/signup')
            .send({ name: 'Test User', email: 'dup@example.com', password: 'password123' });

        const res = await request(app)
            .post('/signup')
            .send({ name: 'Another User', email: 'dup@example.com', password: 'password456' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/already registered/i);
    });

   it('rejects signup with missing fields', async () => {
        const res = await request(app)
            .post('/signup')
            .send({ email: 'incomplete@example.com' });

        expect(res.statusCode).toBe(400);
    });

    it('rejects signup with invalid email format', async () => {
        const res = await request(app)
            .post('/signup')
            .send({ name: 'Test User', email: 'not-an-email', password: 'password123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Validation failed');
    });

    it('rejects signup with short password', async () => {
        const res = await request(app)
            .post('/signup')
            .send({ name: 'Test User', email: 'shortpass@example.com', password: '123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Validation failed');
    });
});

describe('POST /login', () => {
    beforeEach(async () => {
        await request(app)
            .post('/signup')
            .send({ name: 'Login Test', email: 'login@example.com', password: 'correctpassword' });
    });

    it('logs in successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'login@example.com', password: 'correctpassword' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('rejects login with wrong password', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'login@example.com', password: 'wrongpassword' });

        expect(res.statusCode).toBe(401);
    });

    it('rejects login for non-existent email', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'doesnotexist@example.com', password: 'whatever' });

        expect(res.statusCode).toBe(401);
    });



describe('Refresh token flow', () => {
    let refreshToken;
    let accessToken;

    beforeAll(async () => {
        await request(app)
            .post('/signup')
            .send({ name: 'Refresh Tester', email: 'refresh@example.com', password: 'password123' });

        const loginRes = await request(app)
            .post('/login')
            .send({ email: 'refresh@example.com', password: 'password123' });

        accessToken = loginRes.body.token;
        refreshToken = loginRes.body.refreshToken;
    });

    it('issues both an access token and a refresh token on login', () => {
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
    });

    it('issues a new access token given a valid refresh token', async () => {
        const res = await request(app)
            .post('/refresh-token')
            .send({ refreshToken });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it('rejects an invalid refresh token', async () => {
        const res = await request(app)
            .post('/refresh-token')
            .send({ refreshToken: 'not-a-real-token' });

        expect(res.statusCode).toBe(403);
    });

    it('invalidates the refresh token on logout', async () => {
        const logoutRes = await request(app)
            .post('/logout')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(logoutRes.statusCode).toBe(200);

        const refreshRes = await request(app)
            .post('/refresh-token')
            .send({ refreshToken });

        expect(refreshRes.statusCode).toBe(403);
    });
});
});