// app.js
import express from 'express';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';
import mongoSanitize from '@exortek/express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // ✅ Add this line
import cookieParser from 'cookie-parser';
import globalErrorHandler from './controllers/errorController.js';
import tourRouter from './routes/tourRouter.js';
import userRouter from './routes/userRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import AppError from './utils/AppError.js';
import viewRouter from './routes/viewRouter.js';
import bookingRouter from './routes/bookingRouter.js';
import compression from 'compression';

dotenv.config({
  path: './config.env'
}); // ✅ Load env vars

const app = express();

// ✅ Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
}

// ✅ Set HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com'
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://*.tile.openstreetmap.org',
          'https://*.tile.openstreetmap.fr'
        ],
        connectSrc: ["'self'"],
        fontSrc: [
          "'self'",
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com'
        ],
        frameAncestors: ["'self'"]
      }
    }
  })
);
// ✅ Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after an hour'
});
app.use('/api', limiter);

// ✅ Body parser
app.set('query parser', 'extended');
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
// ✅ Sanitize data
app.use(xss());
app.use(mongoSanitize({ replaceWith: '_' }));

// ✅ Static files & Pug setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());

// ✅ Routes
app.use('/', viewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// ✅ Handle unhandled routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
// ✅ Global error handler
app.use(globalErrorHandler);

export default app;
