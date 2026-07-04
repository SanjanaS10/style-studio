const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
        orders: { create: jest.fn() }
    }));
});

// Mock Redis so tests don't need a real Redis server
jest.mock('redis', () => {
    const store = {};
    return {
        createClient: () => ({
            on: jest.fn(),
            connect: jest.fn().mockResolvedValue(),
            get: jest.fn((key) => Promise.resolve(store[key] || null)),
            setEx: jest.fn((key, ttl, value) => {
                store[key] = value;
                return Promise.resolve();
            }),
        }),
    };
});

jest.setTimeout(20000);

let mongoServer;
let app;
let token;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test_secret_key';

    app = require('../server');

    await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('open', resolve);
    });

    await request(app)
        .post('/signup')
        .send({ name: 'Cart Tester', email: 'cart@example.com', password: 'password123' });

    const loginRes = await request(app)
        .post('/login')
        .send({ email: 'cart@example.com', password: 'password123' });

    token = loginRes.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('Cart endpoints', () => {
    it('rejects cart access without a token', async () => {
        const res = await request(app).get('/cart');
        expect(res.statusCode).toBe(401);
    });

    it('fetches empty cart on first request (from db)', async () => {
        const res = await request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.cart).toEqual([]);
        expect(res.body.source).toBe('db');
    });

    it('updates the cart successfully', async () => {
        const newCart = [{ productId: 'p1', name: 'Shirt', price: '499', quantity: 2 }];

        const res = await request(app)
            .put('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ cart: newCart });

        expect(res.statusCode).toBe(200);
        expect(res.body.cart).toHaveLength(1);
        expect(res.body.cart[0]).toMatchObject(newCart[0]);
    });

    it('serves updated cart from cache on next fetch', async () => {
        const res = await request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.source).toBe('cache');
        expect(res.body.cart[0].name).toBe('Shirt');
    });

    it('rejects invalid cart payload', async () => {
        const res = await request(app)
            .put('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ cart: 'not-an-array' });

        expect(res.statusCode).toBe(400);
    });
});