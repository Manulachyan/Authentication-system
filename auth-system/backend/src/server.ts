import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { redis } from './config/redis';

const startServer = async () => {
  await connectDB();

  // Test redis connection
  await redis.ping();

  app.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});