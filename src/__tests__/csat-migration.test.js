/**
 * CSAT Dashboard Hyperlink Migration — Verification Tests
 *
 * Validates:
 * 1. Session expiry removal (no expiresAt, no maxAge)
 * 2. /auth/show-csat role-based access
 */

import { jest } from '@jest/globals';

// ─── Mock models BEFORE importing service ─────────────────────────────────────
const mockSessionCreate = jest.fn().mockResolvedValue({});
const mockSessionFindOne = jest.fn();
const mockSessionUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
const mockUserFindOne = jest.fn();

jest.unstable_mockModule('../models/index.js', () => ({
    Session: {
        create: mockSessionCreate,
        findOne: (...args) => {
            const result = mockSessionFindOne(...args);
            return { lean: () => result };
        },
        updateOne: mockSessionUpdateOne,
    },
    User: {
        findOne: (...args) => {
            const result = mockUserFindOne(...args);
            return { lean: () => result };
        },
    },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
const {
    getSessionCookieOptions,
    createSession,
    validateSessionToken,
    clearSessionCookie,
    SESSION_COOKIE_NAME,
} = await import('../services/session.service.js');

const { showCsat } = await import('../controllers/auth.controller.js');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Session Service Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('Session Service — Expiry Removed', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Cookie Options ─────────────────────────────────────────────────────────
    test('getSessionCookieOptions should NOT include maxAge', () => {
        const opts = getSessionCookieOptions();
        expect(opts).not.toHaveProperty('maxAge');
        expect(opts).not.toHaveProperty('expires');
    });

    test('getSessionCookieOptions should use sameSite lax', () => {
        const opts = getSessionCookieOptions();
        expect(opts.sameSite).toBe('lax');
        expect(opts.httpOnly).toBe(true);
        expect(opts.secure).toBe(true);
        expect(opts.path).toBe('/');
    });

    test('SESSION_COOKIE_NAME should be csat_session', () => {
        expect(SESSION_COOKIE_NAME).toBe('csat_session');
    });

    // ── createSession ──────────────────────────────────────────────────────────
    test('createSession should NOT pass expiresAt to Session.create', async () => {
        const result = await createSession({
            userId: 'user123',
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
        });

        // Returns only rawToken, no expiresAt
        expect(result).toHaveProperty('rawToken');
        expect(result).not.toHaveProperty('expiresAt');

        // Session.create called without expiresAt
        expect(mockSessionCreate).toHaveBeenCalledTimes(1);
        const createArg = mockSessionCreate.mock.calls[0][0];
        expect(createArg).not.toHaveProperty('expiresAt');
        expect(createArg).toHaveProperty('isValid', true);
        expect(createArg).toHaveProperty('userId', 'user123');
    });

    // ── validateSessionToken ───────────────────────────────────────────────────
    test('validateSessionToken should NOT check expiresAt — valid session returns user', async () => {
        const fakeSession = {
            _id: 'sess1',
            userId: 'user1',
            isValid: true,
            expiresAt: new Date('2020-01-01'), // way in the past — should still work
        };
        const fakeUser = { _id: 'user1', name: 'Test', role: 'admin', isActive: true };

        mockSessionFindOne.mockResolvedValue(fakeSession);
        mockUserFindOne.mockResolvedValue(fakeUser);

        const result = await validateSessionToken('some-token');

        expect(result).not.toBeNull();
        expect(result.session).toEqual(fakeSession);
        expect(result.user).toEqual(fakeUser);

        // Verify findOne does NOT include expiresAt filter
        const findOneArg = mockSessionFindOne.mock.calls[0][0];
        expect(findOneArg).not.toHaveProperty('expiresAt');
        expect(findOneArg).toHaveProperty('isValid', true);
    });

    test('validateSessionToken should return null for invalid session (isValid: false)', async () => {
        mockSessionFindOne.mockResolvedValue(null);

        const result = await validateSessionToken('invalid-token');
        expect(result).toBeNull();
    });

    test('validateSessionToken should return null for empty token', async () => {
        const result = await validateSessionToken('');
        expect(result).toBeNull();
        expect(mockSessionFindOne).not.toHaveBeenCalled();
    });

    test('validateSessionToken — if user not found, invalidates session', async () => {
        const fakeSession = { _id: 'sess2', userId: 'gone-user', isValid: true };
        mockSessionFindOne.mockResolvedValue(fakeSession);
        mockUserFindOne.mockResolvedValue(null);

        const result = await validateSessionToken('some-token');

        expect(result).toBeNull();
        expect(mockSessionUpdateOne).toHaveBeenCalledWith(
            { _id: 'sess2' },
            { $set: { isValid: false } }
        );
    });

    // ── clearSessionCookie ─────────────────────────────────────────────────────
    test('clearSessionCookie should use sameSite lax', () => {
        delete process.env.COOKIE_DOMAIN;
        const mockRes = { clearCookie: jest.fn() };
        clearSessionCookie(mockRes);

        expect(mockRes.clearCookie).toHaveBeenCalledWith('csat_session', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
        });
    });

    // ── Cross-domain cookie (COOKIE_DOMAIN env var) ──────────────────────────
    test('getSessionCookieOptions includes domain when COOKIE_DOMAIN is set', () => {
        process.env.COOKIE_DOMAIN = '.schbanglabs.com';
        const opts = getSessionCookieOptions();
        expect(opts.domain).toBe('.schbanglabs.com');
        delete process.env.COOKIE_DOMAIN;
    });

    test('getSessionCookieOptions omits domain when COOKIE_DOMAIN is not set', () => {
        delete process.env.COOKIE_DOMAIN;
        const opts = getSessionCookieOptions();
        expect(opts).not.toHaveProperty('domain');
    });

    test('clearSessionCookie includes domain when COOKIE_DOMAIN is set', () => {
        process.env.COOKIE_DOMAIN = '.schbanglabs.com';
        const mockRes = { clearCookie: jest.fn() };
        clearSessionCookie(mockRes);

        expect(mockRes.clearCookie).toHaveBeenCalledWith('csat_session', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            domain: '.schbanglabs.com',
        });
        delete process.env.COOKIE_DOMAIN;
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. showCsat Controller Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('/auth/show-csat — Role-Based Access', () => {
    const buildReq = (user = null) => ({ user });
    const buildRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    test('returns showCsat: true for admin role', async () => {
        const req = buildReq({ _id: '1', role: 'admin', isActive: true });
        const res = buildRes();

        await showCsat(req, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            showCsat: true,
        });
    });

    test('returns showCsat: true for head_department role', async () => {
        const req = buildReq({ _id: '2', role: 'head_department', isActive: true });
        const res = buildRes();

        await showCsat(req, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            showCsat: true,
        });
    });

    test('returns showCsat: false for user role', async () => {
        const req = buildReq({ _id: '3', role: 'user', isActive: true });
        const res = buildRes();

        await showCsat(req, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            showCsat: false,
        });
    });

    test('returns showCsat: false for sbu role', async () => {
        const req = buildReq({ _id: '4', role: 'sbu', isActive: true });
        const res = buildRes();

        await showCsat(req, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            showCsat: false,
        });
    });

    test('returns 401 when no user (unauthenticated)', async () => {
        const req = buildReq(null);
        const res = buildRes();

        await showCsat(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Unauthorized. Login required.',
        });
    });
});
