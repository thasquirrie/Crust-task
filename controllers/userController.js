const pool = require('../db');
const AppError = require('../middlewares/appError');
const catchAsync = require('../middlewares/catchAsync');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {promisify} = require('util');

// const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN;
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

const JWT_SECRET = 'seeicarrymyhustleformyshoulderjejenimonloanirogunakoba';
const JWT_COOKIE_EXPIRES_IN = '1';
const JWT_EXPIRES_IN = '1d';


const signToken = (id) => {
  return jwt.sign({ id: id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const createSignedToken = (user, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      // Date.now() + (1000 * 60) 
      Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // if (NODE_ENV === 'production') cookies.secure = true;

  res.cookie('jwt', token, cookieOptions);

  return token;
};

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await new Promise((resolve, reject) => {
    pool.query('SELECT id, email, username FROM users', (error, result) => {
      if (error) return next(new AppError('Error fetching data', 400));
      resolve(result.rows);
    });
  });

  console.log({ users });
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {  
  const {id} = req.user;
  const response = await pool.query('SELECT * FROM users WHERE id = $1', [
    id,
  ]);

  const user = response.rows;

  if (user.length === 0) return next(new AppError('No user found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  let { username, email, password, confirm_password } = req.body;

  if (password !== confirm_password)
    return next(new AppError('Passwords does not match', 400));

  const hashedPassword = await bcrypt.hash(password, 12);
  confirm_password = '';

  const insertQuery =
    'INSERT INTO users (username, email, password, confirm_password) VALUES ($1, $2, $3, $4) RETURNING id, username, email';

  const values = [username, email, hashedPassword, confirm_password];

  const user = await new Promise((resolve, reject) => {
    pool.query(insertQuery, values, (error, result) => {
      console.log({error});
      if (error) return next(new AppError(error, 400));

      resolve(result.rows[0]);
    });
  });

  const token = createSignedToken(user, res);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
});

exports.login = catchAsync(async (req, res, next) => {
  const {email, password} = req.body;

  const user = await new Promise((resolve, reject) => {
    pool.query('SELECT id, email, password, username FROM users WHERE email = $1', [email], (error, result) => {
      if (error) return next(new AppError(error, 400));

      resolve(result.rows[0]);
    })
  });

  const matchedPassword = user && await bcrypt.compare(password, user.password);

  if(!matchedPassword) return next(new AppError('Incorrect login credentials, try again', 400));

  const token = createSignedToken(user, res);

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  })

})

exports.protect = catchAsync(async (req, res, next) => {
  let token = '';

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Bearer:', { token });
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log('Cookie:', { token });
  }


  if (!token)
    return next(
      new AppError(
        'You are not logged in! Please login to access this route',
        401
      )
    );

  const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
  
  const user = await new Promise((resolve, reject) => {
    pool.query('SELECT email, username, id FROM users WHERE id = $1', [decoded.id], (error, result) => {
      if (error) return next(new AppError(error, 400));

      resolve(result.rows[0]);
    })
  })

  if (!user && decoded) {
    return next(
      new AppError(
        'This token does not belong to any user in this database',
        404
      )
    );
  }

  if (decoded.exp * 1000 < Date.now())
    return next(new AppError('Token has expired. Please log in again', 409));

  console.log('We got to this point');

  req.user = user;

  next();
});


