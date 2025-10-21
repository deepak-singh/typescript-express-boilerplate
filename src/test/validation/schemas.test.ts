import {
  mongoIdSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  createUserSchema,
  updateUserSchema,
  paginationSchema,
} from '@/validation/schemas';

describe('Validation Schemas', () => {
  describe('mongoIdSchema', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '000000000000000000000000',
        'ffffffffffffffffffffffff',
      ];

      validIds.forEach(id => {
        expect(() => mongoIdSchema.parse(id)).not.toThrow();
      });
    });

    it('should reject invalid MongoDB ObjectId', () => {
      const invalidIds = [
        'invalid-id',
        '507f1f77bcf86cd79943901', // too short
        '507f1f77bcf86cd7994390111', // too long
        '507f1f77bcf86cd79943901g', // invalid character
        '',
        'not-a-mongo-id',
      ];

      invalidIds.forEach(id => {
        expect(() => mongoIdSchema.parse(id)).toThrow();
      });
    });
  });

  describe('emailSchema', () => {
    it('should validate valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        '',
        'user@example',
        'user name@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('passwordSchema', () => {
    it('should validate valid passwords', () => {
      const validPasswords = [
        'password123',
        '123456',
        'a'.repeat(6),
        'a'.repeat(128),
        'MySecurePassword123!',
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        '12345', // too short
        'a'.repeat(129), // too long
        '', // empty
        '     ', // whitespace only
      ];

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('nameSchema', () => {
    it('should validate valid names', () => {
      const validNames = [
        'John',
        'Jane Doe',
        'José María',
        'Jean-Pierre',
        'a'.repeat(2),
        'a'.repeat(50),
        '  John  ', // should be trimmed
      ];

      validNames.forEach(name => {
        expect(() => nameSchema.parse(name)).not.toThrow();
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        'a', // too short
        'a'.repeat(51), // too long
        '', // empty
      ];

      invalidNames.forEach(name => {
        expect(() => nameSchema.parse(name)).toThrow();
      });
    });

    it('should trim whitespace from names', () => {
      const result = nameSchema.parse('  John Doe  ');
      expect(result).toBe('John Doe');
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
      };

      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid registration data', () => {
      const invalidData = [
        { email: 'invalid-email', name: 'John', password: 'password123' },
        { email: 'test@example.com', name: 'a', password: 'password123' },
        { email: 'test@example.com', name: 'John', password: '123' },
        { email: 'test@example.com', name: 'John' }, // missing password
        { name: 'John', password: 'password123' }, // missing email
      ];

      invalidData.forEach(data => {
        expect(() => registerSchema.parse(data)).toThrow();
      });
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid login data', () => {
      const invalidData = [
        { email: 'invalid-email', password: 'password123' },
        { email: 'test@example.com', password: '' },
        { email: 'test@example.com' }, // missing password
        { password: 'password123' }, // missing email
      ];

      invalidData.forEach(data => {
        expect(() => loginSchema.parse(data)).toThrow();
      });
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token data', () => {
      const validData = {
        refreshToken: 'valid.refresh.token',
      };

      expect(() => refreshTokenSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid refresh token data', () => {
      const invalidData = [
        { refreshToken: '' },
        {}, // missing refreshToken
      ];

      invalidData.forEach(data => {
        expect(() => refreshTokenSchema.parse(data)).toThrow();
      });
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate valid profile update data', () => {
      const validData = [
        { name: 'New Name' },
        { email: 'new@example.com' },
        { password: 'newpassword123' },
        { name: 'New Name', email: 'new@example.com' },
        { name: 'New Name', email: 'new@example.com', password: 'newpassword123' },
        {}, // empty object should be valid (all fields optional)
      ];

      validData.forEach(data => {
        expect(() => updateProfileSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject invalid profile update data', () => {
      const invalidData = [
        { name: 'a' }, // name too short
        { email: 'invalid-email' }, // invalid email
        { password: '123' }, // password too short
        { name: 'a'.repeat(51) }, // name too long
      ];

      invalidData.forEach(data => {
        expect(() => updateProfileSchema.parse(data)).toThrow();
      });
    });
  });

  describe('createUserSchema', () => {
    it('should validate valid user creation data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password123',
      };

      expect(() => createUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid user creation data', () => {
      const invalidData = [
        { email: 'invalid-email', name: 'John', password: 'password123' },
        { email: 'test@example.com', name: 'a', password: 'password123' },
        { email: 'test@example.com', name: 'John', password: '123' },
      ];

      invalidData.forEach(data => {
        expect(() => createUserSchema.parse(data)).toThrow();
      });
    });
  });

  describe('updateUserSchema', () => {
    it('should validate valid user update data', () => {
      const validData = [
        { name: 'New Name' },
        { email: 'new@example.com' },
        { password: 'newpassword123' },
        { name: 'New Name', email: 'new@example.com' },
        {}, // empty object should be valid
      ];

      validData.forEach(data => {
        expect(() => updateUserSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject invalid user update data', () => {
      const invalidData = [
        { name: 'a' }, // name too short
        { email: 'invalid-email' }, // invalid email
        { password: '123' }, // password too short
      ];

      invalidData.forEach(data => {
        expect(() => updateUserSchema.parse(data)).toThrow();
      });
    });
  });

  describe('paginationSchema', () => {
    it('should validate valid pagination parameters', () => {
      const validData = [
        { page: '1', limit: '10' },
        { page: '2', limit: '25' },
        { page: '100', limit: '50' },
        {}, // should default to page=1, limit=10
        { page: '1' }, // should default limit to 10
        { limit: '20' }, // should default page to 1
      ];

      validData.forEach(data => {
        expect(() => paginationSchema.parse(data)).not.toThrow();
      });
    });

    it('should transform string numbers to integers', () => {
      const data = { page: '2', limit: '25' };
      const result = paginationSchema.parse(data);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
    });

    it('should apply default values', () => {
      const result = paginationSchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should reject invalid pagination parameters', () => {
      const invalidData = [
        { page: '0' }, // page must be positive
        { page: '-1' }, // page must be positive
        { limit: '0' }, // limit must be positive
        { limit: '-1' }, // limit must be positive
      ];

      invalidData.forEach(data => {
        expect(() => paginationSchema.parse(data)).toThrow();
      });
    });

    it('should enforce limit maximum of 100', () => {
      const data = { limit: '150' };
      
      expect(() => paginationSchema.parse(data)).toThrow();
    });
  });
});
