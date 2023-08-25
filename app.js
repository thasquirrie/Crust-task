const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./middlewares/appError');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
require('./controllers/authController');

dotenv.config({
  path: './config.env',
});

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');
const authRouter = require('./routes/authRoutes');

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/auth', authRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(
      `The requested page: ${req.originalUrl} using the method: ${req.method} not found on this server`,
      404
    )
  );
});

app.use(globalErrorHandler);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
