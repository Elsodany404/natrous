import express from 'express';
import * as authController from '../controllers/authController.js';
import * as reviewController from '../controllers/reviewController.js';

const reviewRouter = express.Router({ mergeParams: true });
// USER
reviewRouter.use(authController.protect);
reviewRouter.use(authController.roleRestrictions('user', 'admin'));

//MERGED
// GET ALL THE REVIEWS
reviewRouter.get('/', reviewController.getAllReviews);
// DELETE REVIEWS
reviewRouter.delete('/:id', reviewController.deleteReview);
// CREATE REVIEW
reviewRouter.post(
  '/',
  reviewController.checkReviewUserTour,
  reviewController.createReview
);
export default reviewRouter;
