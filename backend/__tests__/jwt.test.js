process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_long_abc';
process.env.JWT_EXPIRE = '7d';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_characters_long';
process.env.JWT_REFRESH_EXPIRE = '30d';

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
} = require('../src/utils/jwt');

describe('JWT Utilities', () => {
  const payload = { id: 'user123', role: 'user' };

  describe('generateAccessToken', () => {
    it('should generate a non-empty string token', () => {
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a non-empty string token', () => {
      const token = generateRefreshToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should produce different tokens than access token for same payload', () => {
      const access = generateAccessToken(payload);
      const refresh = generateRefreshToken(payload);
      expect(access).not.toBe(refresh);
    });
  });

  describe('verifyAccessToken', () => {
    it('should decode a valid access token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw on tampered token', () => {
      const token = generateAccessToken(payload) + 'tampered';
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should throw on refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(payload);
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });

    it('should throw on empty string', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should decode a valid refresh token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe(payload.id);
    });

    it('should throw on access token used as refresh token', () => {
      const accessToken = generateAccessToken(payload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });

    it('should throw on tampered token', () => {
      const token = generateRefreshToken(payload) + 'x';
      expect(() => verifyRefreshToken(token)).toThrow();
    });
  });

  describe('generateTokenPair', () => {
    it('should return both accessToken and refreshToken', () => {
      const { accessToken, refreshToken } = generateTokenPair('abc123', 'admin');
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);
    });

    it('should encode role in access token', () => {
      const { accessToken } = generateTokenPair('abc123', 'admin');
      const decoded = verifyAccessToken(accessToken);
      expect(decoded.role).toBe('admin');
      expect(decoded.id).toBe('abc123');
    });
  });
});
