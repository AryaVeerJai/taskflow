process.env.NODE_ENV = 'test';

const { errorHandler, notFound } = require('../src/middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockReq = (overrides = {}) => ({
  method: 'GET', originalUrl: '/test', body: {}, ...overrides,
});
const next = jest.fn();

describe('errorHandler middleware', () => {
  it('should use err.statusCode when provided', () => {
    const res = mockRes();
    const err = new Error('Custom error'); err.statusCode = 422;
    errorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Custom error' }));
  });

  it('should default to 500 when no statusCode', () => {
    const res = mockRes();
    errorHandler(new Error('Boom'), mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should handle Mongoose CastError (invalid ObjectId)', () => {
    const res = mockRes();
    const err = new Error('Cast failed');
    err.name = 'CastError'; err.path = '_id'; err.value = 'bad-id';
    errorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle Mongoose duplicate key error (code 11000)', () => {
    const res = mockRes();
    const err = new Error('Duplicate');
    err.code = 11000; err.keyValue = { email: 'test@test.com' };
    errorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    const msg = res.json.mock.calls[0][0].message;
    expect(msg).toMatch(/email/i);
  });

  it('should handle Mongoose validation error', () => {
    const res = mockRes();
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    err.errors = { name: { message: 'Name is required' }, email: { message: 'Invalid email' } };
    errorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should handle JWT JsonWebTokenError', () => {
    const res = mockRes();
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toBe('Invalid token');
  });

  it('should handle JWT TokenExpiredError', () => {
    const res = mockRes();
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toBe('Token expired');
  });

  it('should not expose stack trace outside development', () => {
    const res = mockRes();
    errorHandler(new Error('Prod error'), mockReq(), res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBeUndefined();
  });
});

describe('notFound middleware', () => {
  it('should call next with a 404 error', () => {
    const req = mockReq({ originalUrl: '/unknown/route' });
    const res = mockRes();
    const nextFn = jest.fn();
    notFound(req, res, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(1);
    const err = nextFn.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.message).toMatch('/unknown/route');
  });
});
