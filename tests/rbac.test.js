const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
        orders: { create: jest.fn() }
    }));
});

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
let mongoose_User;
let userToken;
let adminToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test_secret_key';

    app = require('../server');

    await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('open', resolve);
    });

    // Create a regular user
    await request(app)
        .post('/signup')
        .send({ name: 'Regular User', email: 'user@example.com', password: 'password123' });

    const userLogin = await request(app)
        .post('/login')
        .send({ email: 'user@example.com', password: 'password123' });
    userToken = userLogin.body.token;

    // Create an "admin" user via signup, then promote directly in the DB
    await request(app)
        .post('/signup')
        .send({ name: 'Admin User', email: 'admin@example.com', password: 'password123' });

    const User = mongoose.model('User');
    await User.updateOne({ email: 'admin@example.com' }, { role: 'admin' });

    const adminLogin = await request(app)
        .post('/login')
        .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('GET /admin/orders (RBAC)', () => {
    it('denies access without a token', async () => {
        const res = await request(app).get('/admin/orders');
        expect(res.statusCode).toBe(401);
    });

    it('denies access to a regular user', async () => {
        const res = await request(app)
            .get('/admin/orders')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/admin role required/i);
    });

    it('allows access to an admin user', async () => {
        const res = await request(app)
            .get('/admin/orders')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.orders).toBeDefined();
    });
});