// app.js
import express from 'express';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';
import mongoSanitize from '@exortek/express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';

// ✅ Controllers & Routers
import globalErrorHandler from './controllers/errorController.js';
import * as bookingController from './controllers/bookingController.js';
import tourRouter from './routes/tourRouter.js';
import userRouter from './routes/userRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import bookingRouter from './routes/bookingRouter.js';
import viewRouter from './routes/viewRouter.js';
import AppError from './utils/AppError.js';

// ✅ Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
app.enable('trust proxy');

// ✅ Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
}

// ✅ Set HTTP security headers (optional, can uncomment if needed)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://unpkg.com', // Leaflet JS
        'https://js.stripe.com',
        "'unsafe-inline'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // for custom markers/styles
        'https://unpkg.com',
        'https://fonts.googleapis.com'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https://*.tile.openstreetmap.fr',
        'https://*.googleapis.com'
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: [
        "'self'",
        'https://api.stripe.com',
        'https://events.stripe.com'
      ],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", 'https://js.stripe.com']
    }
  })
);
// ✅ Rate limiting
const limiter = rateLimit({
  max: 100, // max requests per hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after an hour'
});
app.use('/api', limiter);

// ✅ Stripe webhook route (must come BEFORE body parser)
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// ✅ Body parser (for all other routes)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ✅ Sanitize user input
app.use(xss());
app.use(mongoSanitize({ replaceWith: '_' }));

// ✅ Enable CORS
app.use(cors());
app.options(/\/*/, cors());

// ✅ Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// ✅ View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// ✅ Response compression
app.use(compression());

// ✅ Routers
app.use('/', viewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// ✅ Handle unhandled routes
app.all(/\/*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ✅ Global error handler
app.use(globalErrorHandler);

export default app;
