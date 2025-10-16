import express from 'express';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/sign-up', authController.signUp);
userRouter.post('/login', authController.login);
userRouter.post('/forgot-password', authController.forgotPassword);
userRouter.post('/logout', authController.logout);
userRouter.patch('/reset-password/:token', authController.resetPassword);
// User
userRouter.use(authController.protect);

// UPDATE CURRENT USER PASSWORD
userRouter.patch('/update-password', authController.updateUserPassword);
// UPDATE CURRENT USER DATA
userRouter.patch(
  '/update-me',
  userController.uploadPhoto,
  userController.processPhoto,
  userController.updateMe
);
// GET CURRENT USER DATA
userRouter.get('/get-me', userController.getMe, userController.getUser);
// DELETE CURRENT USER
userRouter.delete('/delete-me', userController.deleteMe);

// ADMIN
userRouter.use(authController.roleRestrictions('admin'));
// GET USER
userRouter.get('/:id', userController.getUser);
// GET ALL USER
userRouter.get('/', userController.getAllUsers);
// DELETE USER
userRouter.delete('/:id', userController.deleteUser);

export default userRouter;
