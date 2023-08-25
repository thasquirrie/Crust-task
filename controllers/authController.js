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

const StrategyWithReqRes = (req, res) =>
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const account = profile._json;
      console.log({ account });
      const username = `${account.given_name.toLowerCase()}_${account.family_name.toLowerCase()}`;
      const password = '';
      const confirm_password = '';

      let user = {};

      try {
        const selectQuery = `SELECT username, email, id FROM users WHERE email=$1`;
        const insertQuery =
          'INSERT INTO users (username, email, password, confirm_password) VALUES ($1, $2, $3, $4) RETURNING id, username, email';
        const userQuery = await pool.query(selectQuery, [account.email]);

        if (userQuery.rows.length === 0) {
          user = await new Promise((resolve, reject) => {
            pool.query(
              insertQuery,
              [username, account.email, password, confirm_password],
              (error, result) => {
                if (error) return next(new AppError(error, 400));

                resolve(result.rows[0]);
              }
            );
          });
        } else {
          user = userQuery.rows[0];
        }
        done(null, user);
      } catch (error) {
        console.log({ error });
        done(error);
      }
    }
  );

passport.use(StrategyWithReqRes);


