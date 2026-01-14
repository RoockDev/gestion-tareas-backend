import { Router } from "express";
import { check } from "express-validator";
import { getUsers,getUserById,createUser,updateUser,deleteUser } from "../controllers/userController.js";
import { validateFields } from "../middlewares/validateFields.js";
import { validateJWT } from "../middlewares/validate-jwt.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = Router();

//Todas las rutas de abajo requieren token y ser admin
router.use([validateJWT,isAdmin]);

//Listar todos los usuarios
router.get('/', getUsers);

//Obtener user por id
router.get('/:id',[
    check('id', 'No es un Id válido').isMongoId(),
    validateFields
],getUserById);

//crear usuario
router.post('/',[
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El correo es obligatorio').isEmail(),
    check('password', 'La contraseña debe tener más de 6 caracteres').isLength({min:6}),
    validateFields
],createUser);

//actualizar usuario
router.put('/:id', [
    check('id', 'No es un Id válido').isMongoId(),
    validateFields
],updateUser);


//borrar usuario soft delete
router.delete('/:id', [
    check('id', 'No es un Id válido').isMongoId(),
    validateFields
],deleteUser);


export default router;