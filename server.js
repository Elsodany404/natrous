// server.js
import dotenv from 'dotenv';

dotenv.config({
  path: './config.env'
}); // Load env vars first

import mongoose from 'mongoose';

// use top-level await for dynamic import
const { default: app } = await import('./app.js');

// connect database
try {
  await mongoose.connect(
    process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)
  );
  console.log(':) Database connected');

  app.listen(process.env.PORT, () => {
    console.log(`:) Server running on port ${process.env.PORT}`);
  });
} catch (err) {
  console.error(':( DB connection failed:', err.message);
}
