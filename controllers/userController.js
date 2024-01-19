const user = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');

const AppError = require('../utils/appError');

const factory = require('./handlerFactory');

filterObj = (obj, ...allowedFields) => {
  Object.keys(obj).forEach((el) => {
    if (!allowedFields.includes(el)) delete obj[el];
  });
  return obj;
};

exports.getSelf = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateSelf = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await user.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteSelf = catchAsync(async (req, res, next) => {
  const user = await user.findByIdAndUpdate(req.user.id);
  user.active = false;
  await user.save();
  res.status(204).json({
    message: null,
  });
});

exports.getUser = factory.getOne(user);

exports.getAllUsers = factory.getAll(user);

exports.updateUser = factory.updateOne(user);

exports.deleteUser = factory.deleteOne(user);
