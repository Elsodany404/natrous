import * as handlerFactory from './handlerFactory.js';
import Booking from '../models/bookingModel.js';

export const createBooking = handlerFactory.createOne(Booking);
export const deleteBooking = handlerFactory.deleteOne(Booking);
export const getAllbookings = handlerFactory.getAll(Booking);
export const updateBooking = handlerFactory.updateOne(Booking);
export const getBooking = handlerFactory.getOne(Booking);
