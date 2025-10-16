import express from 'express';
import * as tourController from '../controllers/tourController.js';
import * as authController from '../controllers/authController.js';
import reviewRouter from './reviewRouter.js';

const tourRouter = express.Router();
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.route('/group-by-difficulty').get(tourController.groupByDifficulty);
tourRouter.route('/monthly-plan/:year').get(tourController.monthlyPlan);
tourRouter
  .route('/distance/:dist/center/:latlng/unit/:unit')
  .get(tourController.searchTourWithin);
tourRouter.route('/distance/:latlng').get(tourController.searchTourNear);
tourRouter
  .route('/top-5-cheap')
  .get(tourController.getTopCheapTours, tourController.getAllTours);

// // MODIFING TOURS
// tourRouter.use(authController.protect);
// tourRouter.use(authController.roleRestrictions('admin', 'guide'));

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    tourController.uploadPhoto,
    tourController.processPhoto,
    tourController.updateTour
  )
  .delete(tourController.deleteTour);

export default tourRouter;
