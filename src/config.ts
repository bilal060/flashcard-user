import { ConfigProps } from './config.interface';

export const config = (): ConfigProps => ({
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,
});
