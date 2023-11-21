import { Router } from 'express';
import { loginUser, registerUser, updateUser } from '../controllers/auth';

const router = Router();

// User authentication routes
router.post('/login', loginUser);
router.post('/register', registerUser);

router.put('/:id', updateUser);

export default router;
