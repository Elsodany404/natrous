import * as handlerFactory from './handlerFactory.js';
import Booking from '../models/bookingModel.js';
import catchAsync from '../utils/catchAsync.js';
import Tour from '../models/tourModel.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const createBooking = handlerFactory.createOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const getAllbookings = handlerFactory.getAll(Booking);
export const updateBooking = handlerFactory.updateOne(Booking);
export const getBooking = handlerFactory.getOne(Booking);

export const createCheckoutSession = catchAsync(async (req, res, next) => {
  // get resource you want to buy with id
  const tour = await Tour.findById(req.params.tourID);
  // generate session (sending tourID, userEmail, and the item info)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // credit card method
    success_url: `${req.protocol}://${req.get('host')}`, // redirecting to whatever you need after session being consumed
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // if the user click cancel
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    /* this is what we will stripe by and asking
      for it using get method and this is what we
      used in web hook to store info in our database 
      that is resource is consumed (really important)*/
    line_items: [
      {
        name: `${tour.name}`,
        description: `${tour.summary}`,
        images: '',
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  // send session
  res.status(200).json({
    status: 'success',
    session
  });
});
