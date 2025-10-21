import * as handlerFactory from './handlerFactory.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import Tour from '../models/tourModel.js';
import AppError from '../utils/AppError.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const createBooking = handlerFactory.createOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const getAllbookings = handlerFactory.getAll(Booking);
export const updateBooking = handlerFactory.updateOne(Booking);
export const getBooking = handlerFactory.getOne(Booking);

export const createCheckoutSession = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourID);
    const baseUrl =
      process.env.DEV_TUNNEL_URL || `${req.protocol}://${req.get('host')}`;

    console.log('✅ Using base URL:', baseUrl);
    console.log(
      '✅ Final image URL:',
      `${baseUrl}/img/tours/${tour.imageCover}`
    );
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${baseUrl}/my-bookings`,
      cancel_url: `${baseUrl}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourID,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tour.name,
              description: tour.summary,
              images: [`${baseUrl}/img/tours/${tour.imageCover}`]
            },
            unit_amount: tour.price * 100
          },
          quantity: 1
        }
      ]
    });

    // Return the URL directly
    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
    console.log('ERROR 💥', error.message);
    console.log('STACK 🧩', error.stack);
    console.log('FULL ERROR 🔍', JSON.stringify(error, null, 2));
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const createBookingCheckout = async (session) => {
  console.log('creating booking in the database');

  // Fetch the full session with line items from Stripe
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items']
  });

  const tour = fullSession.client_reference_id;
  const user = await User.findOne({ email: fullSession.customer_email });

  const price = fullSession.line_items.data[0].price.unit_amount / 100; // Stripe returns line_items.data array

  await Booking.create({ tour, user, price });
  console.log('✅ Booking was created');
};
// In bookingController.js
export const webhookCheckout = (req, res, next) => {
  console.log('✅ Webhook was received successfully');
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('🎉 Mission completed respect!!!!');
  } catch (err) {
    console.error('❌ Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log('📦 Event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};
