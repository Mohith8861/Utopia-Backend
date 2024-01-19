const express = require('express');

const app = express();

const userRouter = require('./routers/userRouters');

const tourRouter = require('./routers/tourRouters');

const reviewRouter = require('./routers/reviewRoutes');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');

// const rateLimit = require('express-rate-limit');

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');

const cookieParser = require('cookie-parser');

const xss = require('xss-clean');

const path = require('path');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader(
    'Content-Security-Policy',
    'default-src *; img-src *; style-src *;',
  );
  next();
});
app.use(helmet({}));
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
//     },
//     contentSecurityPolicy: false,
//   }),
// );
/*
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/', limiter);
*/
app.use(mongoSanitize());

app.use(xss());

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '/public')));

app.use(express.json());

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}`));

if (process.env.NODE_ENV === 'development') {
  app.use('/', (req, res, next) => {
    console.log('ID:', req.query);
    next();
  });
}

app.use('/', (req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

app.use('/user', userRouter);
app.use('/tour', tourRouter);
app.use('/review', reviewRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server!!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
