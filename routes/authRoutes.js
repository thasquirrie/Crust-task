const express = require('express');
const passport = require('passport');
const { createSignedToken } = require('../controllers/userController');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope:[ 'profile', 'email'],
  })
);

router.get('/google/callback', passport.authenticate('google', {session: true}), (req, res, next)=> {
  const user = req.user;

  const token = createSignedToken(user, res);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
});

module.exports = router;
