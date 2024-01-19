const jwt = require('jsonwebtoken');

const { promisify } = require('util');

const user = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');

const AppError = require('../utils/appError');

const sendEmail = require('../utils/email');

const crypto = require('crypto');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (User, statusCode, message, res) => {
  const token = signToken(User._id);
  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  User.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    User,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await user.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
  });
  createSendToken(newUser, 200, 'success', res);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const User = await user.findOne({ email }).select('+password');
  if (!User || !(await User.correctPassword(password, User.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(User, 200, 'Success', res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await user.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      const currentUser = await user.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user1 = await user.findOne({ email: req.body.email });
  if (!user1) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user1.createPasswordResetToken();
  await user1.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user1.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: message,
    });
  } catch (err) {
    user1.passwordResetToken = undefined;
    user1.passwordResetExpires = undefined;
    await user1.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
  next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user1 = await user.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user1) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user1.password = req.body.password;
  user1.confirmPassword = req.body.confirmPassword;
  user1.passwordResetToken = undefined;
  user1.passwordResetExpires = undefined;
  await user1.save();
  createSendToken(user1, 200, 'password reset sucessfully', res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user1 = await user.findById(req.params.id).select('+password');
  if (!user1) {
    return next(new AppError('User not found', 404));
  }
  if (!(await user1.correctPassword(req.body.password, user1.password))) {
    return next(new AppError('Password entered is Incorrect', 400));
  }
  user1.password = req.body.password;
  user1.confirmPassword = req.body.confirmPassword;
  user1.save();
  createSendToken(user1, 200, 'Password updated successfully', res);
});
