// server.js
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import mongoose from 'mongoose';

dotenv.config({
  path: './config.env'
}); // Load env vars first

const options = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.cert')
};

// use top-level await for dynamic import
const { default: app } = await import('./app.js');

// connect database
try {
  await mongoose.connect(
    process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)
  );
  console.log(':) Database connected');

  https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running on https://localhost:3000');
  });
} catch (err) {
  console.error(':( DB connection failed:', err.message);
}
