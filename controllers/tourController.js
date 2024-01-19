const tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getTopTen = async (req, res, next) => {
  req.query.sort = '-price';
  req.query.limit = '10';
  next();
};

exports.getStats = async (req, res) => {
  const stats = await tour.aggregate([
    {
      $match: {
        price: { $gte: 20000 },
      },
    },
    {
      $group: {
        _id: {
          $toUpper: '$days',
        },
        days: {
          $max: '$days',
        },
        averagePrice: {
          $avg: '$price',
        },
        maxPrice: {
          $max: '$price',
        },
        minPrice: {
          $min: '$price',
        },
      },
    },
  ]);
  res.status(200).json({
    status: 'sucess',
    results: stats.length,
    data: stats,
  });
};

exports.getSlugTours = catchAsync(async function (req, res) {
  const tours = JSON.stringify(
    await tour
      .findOne({
        slug: req.params.slug,
      })
      .populate({ path: 'reviews' }),
  );

  res.status(200).json({
    status: 'success',
    data: JSON.parse(tours),
  });
});

exports.getAllTours = catchAsync(async function (req, res) {
  const tours = await tour.find({
    $text: { $search: req.query.q },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

exports.getTour = factory.getAll(tour);

exports.updateTour = factory.updateOne(tour);

exports.createTour = factory.createOne(tour);

exports.searchTour = factory.getOne(tour, { path: 'reviews' });

exports.deleteTour = factory.deleteOne(tour);
