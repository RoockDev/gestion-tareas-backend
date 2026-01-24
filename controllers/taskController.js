import {response, request} from 'express';
import TaskService from '../services/TaskService.js';
import { ERROR_CODES } from '../helpers/errorCodes.js';
import kleur from 'kleur';

//Dejo todos los console.log con los iconos para ir viendo en la terminal de vscode que todo va funcionando bien si no me lio mucho y no se que funciona y que no
const taskService = new TaskService();
const REDIS_KEY_TASKS = "tasks_all";

//Obtener todas las tareas
const getTasks = async (req = request, res = response,redisClient) => {
    try {

        if (redisClient) {
            const cachedTasks = await redisClient.get(REDIS_KEY_TASKS);
            if (cachedTasks) {
                console.log(kleur.green(`🟢 Cache de tareas usado`));
                return res.status(200).json({
                    success: true,
                    message: 'Listado de tareas (Desde Caché)',
                    data: JSON.parse(cachedTasks)
                });
            }
        }
        const tasks = await taskService.getTasks();

        if (redisClient) {
            await redisClient.setEx(REDIS_KEY_TASKS, 60, JSON.stringify(tasks));
            console.log(kleur.blue(`🔵 Tareas obtenidas de BD y guardadas en Caché`));
        }

        return res.status(200).json({
            success: true,
            message: 'Listado de tareas obtenido correctamente',
            data:tasks
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: 'Error al obtener las tareas',
            data:null
        });
    }
}

//Crear Tarea
const createTask = async (req = request, res = response,redisClient) => {
    try {

        
        //se le pasa el body entero
        const newTask = await taskService.createTask(req.body);

        req.io.emit('server:loadTasks', {
            msg: 'Nueva tarea creada',
            data: newTask
        }) ;

        if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por creación`));
        }

        return res.status(201).json({
            success:true,
            message: 'Tarea creada con exito',
            data: newTask
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: 'Error al crear la tarea',
            data:null
        });
    }
}

//Asignar Tareas - Solo Admin
const assignTask = async (req = request, res = response,redisClient) => {
    const { id } = req.params; //id tarea
    const {userId} = req.body;

    try {
       const taskWithUser = await taskService.assignTask(id,userId);

       req.io.emit('server:loadTasks', { msg: 'Tarea asignada manualmente', data: taskWithUser });

       if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por assignacion`));
        }
       
       return res.status(200).json({
        success:true,
        message: 'Tarea asignada correctamente',
        data: taskWithUser
       });
    } catch (error) {
        console.log(error);

        //manejo de errores especificos definidos en el servicio
        if (error.message === ERROR_CODES.TASK_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: 'La tarea no existe',
                data:null
            });
        }

        if (error.message === ERROR_CODES.USER_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: 'El usuario no existe',
                data:null
            });
        }

        if (error.message) {
            return res.status(400).json({
                success:false,
                message: 'La tarea ya está asignada',
                data:null
            });
        }

        return res.status(500).json({
            success:false,
            message: 'Error al asignar tarea',
            data:null
        });
    }
}

//Cambiar estado de una tarea
const changeStatus = async (req = request, res = response,redisClient) => {
    const {id} = req.params;
    const {status} = req.body;
    const user = req.user;

    try {
        const updatedTask = await taskService.changeStatus(id,status,user);

        req.io.emit('server:loadTasks', { msg: 'Estado de tarea actualizado', data: updatedTask });

        if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por cambio estado`));
        }

        return res.status(200).json({
            success:true,
            message: `Estado actualizado a ${status}`,
            data: updatedTask
        });
    } catch (error) {
        console.log(error);
        if (error.message === ERROR_CODES.TASK_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: 'La tarea no existe',
                data:null
            });
        }
        if (error.message === ERROR_CODES.NOT_AUTHORIZED) {
            return res.status(403).json({
                success:false,
                message: 'No tienes permisos',
                data:null
            });
        }
        if (error.message === ERROR_CODES.INVALID_TRANSITION) {
            return res.status(400).json({
                success:false,
                message: 'Cambio de estado no permitido',
                data:null
            })
        }
    }

    return res.status(500).json({
        success:false,
        message: 'Error inesperado',
        data:null
    });
}

//Liberar una tarea
const releaseTask = async (req = request, res = response,redisClient) => {
    const {id} = req.params;
    const user = req.user;

    try {
        const releasedTask = await taskService.releaseTask(id,user);

        req.io.emit('server:loadTasks', { msg: 'Tarea liberada', data: releasedTask });

        if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por soltar tarea`));
        }

        return res.status(200).json({
            success: true,
            message: 'Tarea liberada, Está disponible de nuevo',
            data: releasedTask
        })
    } catch (error) {
        if (error.message === ERROR_CODES.TASK_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: 'Tarea no existe',
                data:null
            });
        }

        if (error.message === ERROR_CODES.TASK_NOT_ASSIGNED) {
            return res.status(400).json({
                success:false,
                message: 'La tarea no está asignada a nadie, no se puede liberar',
                data: null
            });
        }

        if (error.message === ERROR_CODES.NOT_AUTHORIZED) {
            return res.status(403).json({
                success:false,
                message: 'No tienes permisos para liberar esta tarea',
                data:null
            });
        }
    }

    return res.status(500).json({
        success:false,
        message: 'Error inesperado',
        data:null
    });
}


//autoasignar una tarea - cualquier usuario logeado
const takeTask = async (req = request, res = response,redisClient) => {
    const {id} = req.params;
    const user = req.user; 

    try {
        const task = await taskService.takeTask(id,user);

        req.io.emit('server:loadTasks', { msg: 'Tarea auto-asignada', data: task });

        if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por coger tarea`));
        }

        return res.status(200).json({
            success:true,
            message: 'Tarea auto-asignada correctamente',
            data: task
        });
    } catch (error) {
        console.log(error);
        if (error.message === ERROR_CODES.TASK_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: ' la tarea no existe',
                data: null
            });
        }

        if (error.message === ERROR_CODES.TASK_ALREADY_ASSIGNED) {
            return res.status(400).json({
                success:false,
                message: 'La tarea ya esta asignada',
                data: null
            });
        }

    }

    return res.status(500).json({
        success:false,
        message: 'Error inesperado',
        data:null
    })
}

//deletear tarea -solo admin
const deleteTask = async (req = request, res = response,redisClient) => {
    const { id } = req.params;
    const user = req.user;

    try {
        await taskService.deleteTask(id,user);

        req.io.emit('server:loadTasks', { msg: 'Tarea eliminada', data: null });

        if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por borrado`));
        }
        return res.status(200).json({
            success:true,
            message: 'Tarea eliminada permanentemente',
            data:null // no se devuelven datos por que ya no existe y tampoco es necesario
        })
    } catch (error) {
        console.log(error);

        if (error.message === ERROR_CODES.TASK_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: 'La tarea no existe',
                data:null
            });
        }
        if (error.message === ERROR_CODES.NOT_AUTHORIZED) {
            return res.status(403).json({
                success:false,
                message: 'No tienes permiso para eliminar una tarea',
                data:null
            });
        }
    }

    return res.status(500).json({
        success:false,
        message: 'Error inesperado',
        data:null
    });
}

//updatear tarea - solo admin
const updateTask = async (req = request, res = response,redisClient) => {
    const { id }= req.params;
    const user = req.user;

    const {_id, ...data} = req.body; //desectructuro para sacar el _id y evitar que se pueda intentar cambiar

    try {
        const updatedTask = await taskService.updateTask(id,data,user);

        req.io.emit('server:loadTasks', { msg: 'Tarea modificada por admin', data: updatedTask });

        if (redisClient) {
            await redisClient.del(REDIS_KEY_TASKS);
            console.log(kleur.yellow(`🧹 Caché de tareas limpiada por por updateo`));
        }
        
        return res.status(200).json({
            success: true,
            message: 'Tarea actualizada correctamente',
            data: updatedTask
        });
    } catch (error) {
        console.log(error)
        if (error.message === ERROR_CODES.TASK_NOT_FOUND) {
            return res.status(404).json({
                success:false,
                message: 'La tarea no existe',
                data:null
            });
        }

        if (error.message === ERROR_CODES.NOT_AUTHORIZED) {
            return res.status(403).json({
                success:false,
                message: 'Solo el administrador tiene permisos',
                data:null
            });
        }

        return res.status(500).json({
            success:false,
            message: 'Error inesperado',
            data:null
        });
    }
}

//obtener tareas por rango de dificultad
const getTasksByDifficultyRange = async (req = request, res = response) => {
    const {min,max} = req.query;
    try {
        const tasks = await taskService.getTasksByRange(min,max);

        return res.status(200).json({
            success: true,
            message: 'Operacion exitosa',
            data: tasks
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error al filtrar tareas por rango',
            data: null
        });
    }
};

//numero de tareas de máxima dificultad
const getHighDifficultyStats = async (req = request, res = response) => {
    try {
        
        //el servicio devuelve un objeto {level: 'M', count: '5'}
        const stats = await taskService.countMaxDifficultyTasks();

        return res.status(200).json({
            success: true,
            message: 'respuesta exitosa',
            data: stats
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: 'Error al obtener stats',
            data:null
        });
    }
};

const getTasksByStatus = async (req = request, res = response) => {
    const {status } = req.query;

    try {
        const tasks = await taskService.getTasksByStatus(status);

        return res.status(200).json({
            success: true,
            message: 'Busqueda exitosa',
            data: {
                count: tasks.lenght,
                tasks: tasks
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: 'Error al filtrar por estado',
            data: null
        });
    }

};

export {
    getTasks,
    createTask,
    assignTask,
    changeStatus,
    releaseTask,
    takeTask,
    deleteTask,
    updateTask,
    getTasksByDifficultyRange,
    getHighDifficultyStats,
    getTasksByStatus
}