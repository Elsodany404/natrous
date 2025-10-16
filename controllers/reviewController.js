// import catchAsync from '../utils/catchAsync.js';
import Review from '../models/reviewModel.js';
import * as handlerFactory from './handlerFactory.js';

export const getAllReviews = handlerFactory.getAll(Review);
export const createReview = handlerFactory.createOne(Review);
export const deleteReview = handlerFactory.deleteOne(Review);

export const checkReviewUserTour = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user;
  if (!req.body.tour) req.body.tour = req.params.tourId;
};
