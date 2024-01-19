const express = require('express');

const userController = require('../controllers/userController');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.logIn);
router.post('/signup', authController.signUp);
router.get('/logout', authController.logout);
router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

router.use(authController.protect);

router
  .patch('/updatepassword', authController.updatePassword)
  .delete('/deleteUser', userController.deleteSelf)
  .patch('/updateUser', userController.updateSelf)
  .get('/getUser', userController.getSelf, userController.getUser);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
