import {Router} from 'express';
import {check} from 'express-validator';
import {login,register,googleSignIn} from '../controllers/authController.js';
import { validateFields } from '../middlewares/validateFields.js';

const router = Router();

router.post('/login', [ 
    check('email', 'El correo es obligatorio').isEmail(),
    check('password', 'La contraseña es obligaria').not().isEmpty(),
    validateFields
],login);

router.post('/register', [ 
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El correo no es válido').isEmail(),
    check('password', 'La contraseña debe tener más de 6 letras').isLength({ min: 6 }),
    validateFields
], register );

router.post('/google', [
    check('id_token', 'El id_token es necesario').not().isEmpty(),
    validateFields
],googleSignIn);
export default router;