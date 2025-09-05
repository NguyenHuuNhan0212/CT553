const { getUsers } = require('../controllers/userController.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware.js');
router.get('/users', getUsers);
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
module.exports = router;
