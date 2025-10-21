import dotenv from 'dotenv';
import { config } from './config';

// Load environment variables
dotenv.config();

export { config };
export * from './config';
