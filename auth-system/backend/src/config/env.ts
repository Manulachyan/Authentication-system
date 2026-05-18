import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGO_URI: process.env.MONGO_URI || '',

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '',

  OTP_EXPIRES_MINUTES: parseInt(process.env.OTP_EXPIRES_MINUTES || '10'),

  MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET || 'magic_secret',
  MAGIC_LINK_EXPIRES: process.env.MAGIC_LINK_EXPIRES || '10m',
}; 