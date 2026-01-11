import { Router } from "express";
import { check } from "express-validator";
import userController from "../controllers/userController.js";
import { validateFields } from "../middlewares/validateFields.js";

const router = Router();

router.post('/', [
    //se valida que el campo name no este vacio
    check('name', 'el nombre es obligatorio').not().isEmpty(),
    //se valida que el email tenga el formato correcto
    check('email', 'El correo no es valido').isEmail(),
    //se valida longitud minima de contraseña
    check('password', 'la contraseña deve de tener mas de 6 caracteres').isLength({min:6}),
    //finalmente se valida con nuestro middleware
    validateFields
],userController.createUser);

export default router;