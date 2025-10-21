import { Request } from 'express'; // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
import { UserAuthContext } from '@/models';

declare global {
  namespace Express {
    interface Request {
      user?: UserAuthContext;
      requestId?: string;
      validatedQuery?: {
        page?: number;
        limit?: number;
      };
    }
  }
}

export {};
