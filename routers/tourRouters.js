const express = require('express');

const tourController = require('../controllers/tourController');

const authController = require('../controllers/authController');

const reviewRouter = require('../routers/reviewRoutes');

const router = express.Router();

router.route('/topten').get(tourController.getTopTen, tourController.getTour);

router.route('/getstats').get(tourController.getStats);

router.use(
  '/:tourId/reviews',
  (req, res, next) => {
    next();
  },
  reviewRouter,
);

router
  .route('/')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
router.get('/search', tourController.getAllTours);
router.get('/search/:slug', tourController.getSlugTours);
router
  .route('/:id')
  .get(tourController.searchTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
