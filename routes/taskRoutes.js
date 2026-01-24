import { Router } from "express";
import { check } from "express-validator";
import { validateFields } from "../middlewares/validateFields.js";
import { validateJWT } from "../middlewares/validate-jwt.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
  createTask,
  getTasks,
  assignTask,
  changeStatus,
  releaseTask,
  takeTask,
  deleteTask,
  updateTask,
  getTasksByDifficultyRange,
  getHighDifficultyStats,
  getTasksByStatus
} from "../controllers/taskController.js";
import { executeSeed } from "../controllers/seedController.js";

const taskRoutes = (redisClient) => {
const router = Router();

/**
 * Obtener las tareas por estado
 */

router.get(
  "/filter/status", 
  [
    validateJWT,
    isAdmin,
    check("status", "El estado es obligatorio").not().isEmpty(),
    check("status", "El estado no es válido (todo,doing,done)").isIn([
      "todo",
      "doing",
      "done",
    ]),
    validateFields,
  ],
  getTasksByStatus
);

/**
 * Obtener las tareas de máxima dificultad
 */
router.get(
  "/stats/max-difficulty", 
  [validateJWT, isAdmin],
  getHighDifficultyStats
);

/**
 * Obtener tareas en un rango de dificultad
 * ejemplo ruta : /api/tasks/range?min=S&max=L
 */

router.get(
  "/range",  
  [
    validateJWT,
    isAdmin,
    check("min", "La dificultad mínima es obligatoria (XS, S, M, L, XL)")
      .toUpperCase()
      .isIn(["XS", "S", "M", "L", "XL"]),
    check("max", "La dificultad máxima es obligatoria (XS , S, M, L, XL)")
      .toUpperCase()
      .isIn(["XS", "S", "M", "L", "XL"]),
    validateFields,
  ],
  getTasksByDifficultyRange
);

/**
 * Obtener todas las tareas
 * acceso: privado- cualquier usuario logeado user o admin
 */
router.get( 
  "/",
  [
    validateJWT, //se verifica que tenga token valido
  ],
  (req,res) => getTasks(req,res,redisClient)
);

/**
 * Crear una tarea
 * access: solo admin
 */

router.post( 

  "/",
  [
    validateJWT,
    isAdmin,
    //validaciones de datos
    check("description", "La descripcion es obligatoria").not().isEmpty(),
    check(
      "duration",
      "La duración es obigatoria y debe ser numero"
    ).isNumeric(),
    check("difficulty", "La dificultad es obligatoria").isIn([
      "XS",
      "S",
      "M",
      "L",
      "XL",
    ]),
    validateFields,
  ],
  (req,res) => createTask(req,res,redisClient)
);

/**
 * Asignar tarea a usuario
 * acceso : Admin
 * PATCH porque modificamos una parte del recurso (assignedTo y status)
 */
router.patch(
  "/:id/assign", 
  [
    validateJWT,
    isAdmin,
    check("id", "No es un id de tarea valido").isMongoId(),
    check("userId", "No es un id de usuario valido").isMongoId(),
    check("userId", "El userId es obligatorio").not().isEmpty(),
    validateFields,
  ],
  (req,res) => assignTask(req,res,redisClient)
);

/**
 * Cambiar estado de tarea
 * acceso: privado (tiene que ser usuario o admin )
 */
router.patch(
  "/:id/status", 
  [
    validateJWT,
    check("id", "No es un ID valido").isMongoId(),
    check("status", "El estado es obligatorio").not().isEmpty(),
    check("status", "Estado no válido").isIn(["todo", "doing", "done"]),
    validateFields,
  ],
  (req,res) => changeStatus(req,res,redisClient)
);

/**
 * Liberar una tarea
 * access: privado (tiene que ser usuario o admin)
 */
router.patch( 
  "/:id/release",
  [validateJWT, check("id", "No es un id valido").isMongoId(), validateFields],
  (req,res) => releaseTask(req,res,redisClient)
);

/**
 * Auto-asignar una tarea
 * access: privado (cualquier usuario logeado)
 */
router.patch(
  "/:id/take", 
  [validateJWT, check("id", "No es un id valido").isMongoId(), validateFields],
  (req,res) => takeTask(req,res,redisClient)
);

/**
 * Eliminar tarea
 * access: solo admin
 */
router.delete( 
  "/:id",
  [
    validateJWT,
    isAdmin,
    check("id", "No es un id válido").isMongoId(),
    validateFields,
  ],
  (req,res) => deleteTask(req,res,redisClient)
);

/**
 * Seed repoblar bbdd
 * access - solo admin
 */

router.post("/seed", [validateJWT, isAdmin], executeSeed);

/**
 * Editar Tarea
 * access - solo admin
 */
router.put(
  "/:id",
  [
    validateJWT,
    isAdmin,
    check("id", "No es un Id valido").isMongoId(),
    validateFields,
  ],
  (req,res) => updateTask(req,res,redisClient)
);

return router;
}
export default taskRoutes;
