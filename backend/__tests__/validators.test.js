const { validationResult } = require('express-validator');
const { registerValidator, loginValidator, changePasswordValidator } = require('../src/validators/authValidators');
const { createTaskValidator, updateTaskValidator } = require('../src/validators/taskValidators');

// Helper: run validators against a fake request
const runValidators = async (validators, body, params = {}) => {
  const req = { body, params, query: {}, headers: {}, cookies: {} };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
};

describe('Auth Validators', () => {
  describe('registerValidator', () => {
    it('should pass with valid data', async () => {
      const result = await runValidators(registerValidator, {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass1',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when name is missing', async () => {
      const result = await runValidators(registerValidator, {
        email: 'john@example.com',
        password: 'SecurePass1',
      });
      expect(result.isEmpty()).toBe(false);
      const fields = result.array().map(e => e.path);
      expect(fields).toContain('name');
    });

    it('should fail with invalid email', async () => {
      const result = await runValidators(registerValidator, {
        name: 'John', email: 'notanemail', password: 'SecurePass1',
      });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().map(e => e.path)).toContain('email');
    });

    it('should fail with short password', async () => {
      const result = await runValidators(registerValidator, {
        name: 'John', email: 'john@example.com', password: 'abc',
      });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().map(e => e.path)).toContain('password');
    });

    it('should fail with password missing uppercase', async () => {
      const result = await runValidators(registerValidator, {
        name: 'John', email: 'john@example.com', password: 'lowercase1',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password missing number', async () => {
      const result = await runValidators(registerValidator, {
        name: 'John', email: 'john@example.com', password: 'NoNumbers!',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const result = await runValidators(registerValidator, {
        name: 'John', email: 'john@example.com', password: 'SecurePass1', role: 'superuser',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with name too short', async () => {
      const result = await runValidators(registerValidator, {
        name: 'A', email: 'john@example.com', password: 'SecurePass1',
      });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('loginValidator', () => {
    it('should pass with valid email and password', async () => {
      const result = await runValidators(loginValidator, {
        email: 'user@example.com', password: 'anything',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail without email', async () => {
      const result = await runValidators(loginValidator, { password: 'pass' });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail without password', async () => {
      const result = await runValidators(loginValidator, { email: 'user@example.com' });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('changePasswordValidator', () => {
    it('should pass with valid passwords', async () => {
      const result = await runValidators(changePasswordValidator, {
        currentPassword: 'OldPass1', newPassword: 'NewPass2',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when currentPassword is missing', async () => {
      const result = await runValidators(changePasswordValidator, {
        newPassword: 'NewPass2',
      });
      expect(result.isEmpty()).toBe(false);
    });
  });
});

describe('Task Validators', () => {
  describe('createTaskValidator', () => {
    it('should pass with valid minimal task', async () => {
      const result = await runValidators(createTaskValidator, { title: 'Build something' });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when title is missing', async () => {
      const result = await runValidators(createTaskValidator, { description: 'No title' });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().map(e => e.path)).toContain('title');
    });

    it('should fail when title is too short (< 3 chars)', async () => {
      const result = await runValidators(createTaskValidator, { title: 'Hi' });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid status', async () => {
      const result = await runValidators(createTaskValidator, {
        title: 'Valid title', status: 'unknown',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid priority', async () => {
      const result = await runValidators(createTaskValidator, {
        title: 'Valid title', priority: 'extreme',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should pass with all valid fields', async () => {
      const result = await runValidators(createTaskValidator, {
        title: 'Design the API',
        description: 'Create all endpoints',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2025-12-31T00:00:00.000Z',
        tags: ['backend', 'urgent'],
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid ISO date', async () => {
      const result = await runValidators(createTaskValidator, {
        title: 'Valid title', dueDate: 'not-a-date',
      });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('updateTaskValidator', () => {
    it('should pass with partial update', async () => {
      const result = await runValidators(updateTaskValidator, { status: 'done' });
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid status in update', async () => {
      const result = await runValidators(updateTaskValidator, { status: 'completed' });
      expect(result.isEmpty()).toBe(false);
    });

    it('should pass with empty body (no-op update)', async () => {
      const result = await runValidators(updateTaskValidator, {});
      expect(result.isEmpty()).toBe(true);
    });
  });
});
