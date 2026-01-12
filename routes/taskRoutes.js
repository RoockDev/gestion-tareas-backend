import {Router} from 'express';
import {check} from 'express-validator';
import {validateFields} from '../middlewares/validateFields.js';
import {validateJWT} from '../middlewares/validate-jwt.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import {createTask,getTasks,assignTask} from '../controllers/taskController.js';

const router = Router();

/**
 * Obtener todas las tareas
 * acceso: privado- cualquier usuario logeado user o admin
 */
router.get('/',[
    validateJWT //se verifica que tenga token valido
],getTasks);


/**
 * Crear una tarea
 * access: solo admin
 */

router.post('/',[
    validateJWT, 
    isAdmin,
    //validaciones de datos
    check('description', 'La descripcion es obligatoria').not().isEmpty(),
    check('duration','La duración es obigatoria y debe ser numero').isNumeric(),
    check('difficulty','La dificultad es obligatoria').isIn(['XS','S','M','L','XL']),
    validateFields
],createTask);

/**
 * Asignar tarea a usuario
 * acceso : Admin
 * PATCH porque modificamos una parte del recurso (assignedTo y status)
 */
router.patch('/:id/assign', [
    validateJWT,
    isAdmin,
    check('id', 'No es un id de tarea valido').isMongoId(),
    check('userId', 'No es un id de usuario valido').isMongoId(),
    check('userId', 'El userId es obligatorio').not().isEmpty(),
    validateFields
],assignTask);

export default router;