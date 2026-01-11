import {Router} from 'express';
import {check} from 'express-validator';
import {login} from '../controllers/authController.js';
import { validateFields } from '../middlewares/validateFields.js';

const router = Router();

router.post('/login', [
    check('email', 'El correo es obligatorio').isEmail(),
    check('password', 'La contraseña es obligaria').not().isEmpty(),
    validateFields
],login);

export default router;