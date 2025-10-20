import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as authController from '../controllers/authController.js';

const bookingRouter = express.Router({ mergeParams: true });

bookingRouter
  .route('/')
  .get(bookingController.getAllbookings)
  .post(bookingController.createBooking);
bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
bookingRouter
  .route('/checkout-session/:tourID')
  .post(authController.protect, bookingController.createCheckoutSession);
export default bookingRouter;
