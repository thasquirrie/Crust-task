const catchAsync = require('../middlewares/catchAsync');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth2');
const dotenv = require('dotenv');
const pool = require('../db');
const { createSignedToken } = require('./userController');
const AppError = require('../middlewares/appError');
dotenv.config({
  path: 'config.env',
});

console.log('client', process.env.CLIENT_ID);

const Strategy = new GoogleStrategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    const account = profile._json;
    
    const username = `${account.given_name.toLowerCase()}_${account.family_name.toLowerCase()}`;
    const password = '';
    const first_name = account.given_name;
    const last_name = account.family_name;


    const selectQuery = `SELECT username, email, id, first_name, last_name FROM users WHERE email=$1`;
    const insertQuery =
      'INSERT INTO users (username, email, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, first_name, last_name';

    const userQuery = await pool.query(selectQuery, [account.email]);
    console.log('Query:', userQuery.rows);

    if (userQuery.rows.length === 0) {
      // Insert user into database
      pool.query(
        insertQuery,
        [username, account.email, password, first_name, last_name],
        (error, result) => {
          if (error) return next(new AppError(error, 400));

          console.log('Result:', result.rows[0]);
          return done(null, result.rows[0]);
        }
      );
    } else {
      return done(null, userQuery.rows[0]);
    }
  }
);

passport.use(Strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  pool.query(`SELECT id FROM users WHERE id = $1`, [id], (error, result) => {
    if (error) return done(error, null);
    if (result.rows.length === 1) return done(null, result.rows[0]);
    return done(null, null);
  });
});
