const express = require('express');
const { getUsers, getUser, signup, login, protect } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/user', protect, getUser);
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;