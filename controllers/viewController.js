import Tour from '../models/tourModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({
    slug: req.params.slug
  }).populate('reviews');
  if (!tour) {
    return next(new AppError('There is no tour with this name'));
  }
  res.status(200).render('tour', {
    title: tour.slug,
    tour
  });
});
export const getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
});
export const getSignup = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'sign up'
  });
});

export const getProfile = catchAsync(async (req, res, next) => {
  res.status(200).render('profile', {
    title: 'profile'
  });
});
