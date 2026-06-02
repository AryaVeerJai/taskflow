const { successResponse, errorResponse, paginatedResponse } = require('../src/utils/apiResponse');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('API Response Helpers', () => {
  describe('successResponse', () => {
    it('should send 200 with success: true by default', () => {
      const res = mockRes();
      successResponse(res, { message: 'OK' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'OK' }));
    });

    it('should use provided statusCode', () => {
      const res = mockRes();
      successResponse(res, { statusCode: 201, message: 'Created' });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should include data when provided', () => {
      const res = mockRes();
      successResponse(res, { data: { user: { id: '1' } } });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { user: { id: '1' } } }));
    });

    it('should not include data key when null', () => {
      const res = mockRes();
      successResponse(res, { message: 'No data' });
      const call = res.json.mock.calls[0][0];
      expect(call).not.toHaveProperty('data');
    });

    it('should include meta when provided', () => {
      const res = mockRes();
      successResponse(res, { meta: { page: 1, total: 10 } });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ meta: { page: 1, total: 10 } }));
    });
  });

  describe('errorResponse', () => {
    it('should send 500 with success: false by default', () => {
      const res = mockRes();
      errorResponse(res, { message: 'Error' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Error' }));
    });

    it('should use provided statusCode', () => {
      const res = mockRes();
      errorResponse(res, { statusCode: 404, message: 'Not found' });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should include errors array when provided', () => {
      const res = mockRes();
      const errors = [{ field: 'email', message: 'Invalid' }];
      errorResponse(res, { errors });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors }));
    });

    it('should not include errors key when null', () => {
      const res = mockRes();
      errorResponse(res, { message: 'Bad request' });
      const call = res.json.mock.calls[0][0];
      expect(call).not.toHaveProperty('errors');
    });
  });

  describe('paginatedResponse', () => {
    it('should compute correct meta fields', () => {
      const res = mockRes();
      paginatedResponse(res, { data: [], total: 50, page: 2, limit: 10 });
      const json = res.json.mock.calls[0][0];
      expect(json.meta.total).toBe(50);
      expect(json.meta.page).toBe(2);
      expect(json.meta.limit).toBe(10);
      expect(json.meta.totalPages).toBe(5);
      expect(json.meta.hasNextPage).toBe(true);
      expect(json.meta.hasPrevPage).toBe(true);
    });

    it('should set hasNextPage false on last page', () => {
      const res = mockRes();
      paginatedResponse(res, { data: [], total: 10, page: 1, limit: 10 });
      const json = res.json.mock.calls[0][0];
      expect(json.meta.hasNextPage).toBe(false);
      expect(json.meta.hasPrevPage).toBe(false);
    });

    it('should compute totalPages correctly with remainder', () => {
      const res = mockRes();
      paginatedResponse(res, { data: [], total: 11, page: 1, limit: 10 });
      expect(res.json.mock.calls[0][0].meta.totalPages).toBe(2);
    });
  });
});
