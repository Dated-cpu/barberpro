import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../src/validators/auth';

describe('Auth validators', () => {
  describe('registerSchema', () => {
    it('should accept valid registration', () => {
      const result = registerSchema.safeParse({
        firstName: 'Иван',
        lastName: 'Петров',
        phone: '+79991234567',
        password: 'StrongPass1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        firstName: 'Иван',
        lastName: 'Петров',
        phone: '+79991234567',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone', () => {
      const result = registerSchema.safeParse({
        firstName: 'Иван',
        lastName: 'Петров',
        phone: '12345',
        password: 'StrongPass1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept email login', () => {
      const result = loginSchema.safeParse({
        login: 'test@test.com',
        password: 'password',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty login', () => {
      const result = loginSchema.safeParse({
        login: '',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });
});
