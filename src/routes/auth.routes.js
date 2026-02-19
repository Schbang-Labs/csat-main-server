import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  logout,
  me,
  getUserByEmail,
  updateUserByEmail,
} from '../controllers/auth.controller.js';
import { authorize } from '../middleware/authorization.middleware.js';

const router = Router();
const requireAdmin = authorize({
  role: 'admin',
});

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', me);
router.get('/user', requireAdmin, getUserByEmail);
router.patch('/user', requireAdmin, updateUserByEmail);

export default router;
