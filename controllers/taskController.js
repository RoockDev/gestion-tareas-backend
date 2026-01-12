import {response, request} from 'express';
import TaskService from '../services/TaskService.js';

const taskService = new TaskService();

const getTasks = async (req = request, res = response) => {
    try {
        const tasks = await taskService.getTasks();

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

const createTask = async (req = request, res = response) => {
    try {
        //se le pasa el body entero
        const newTask = await taskService.createTask(req.body);

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

const assignTask = async (req = request, res = response) => {
    const { id } = req.params; //id tarea
    const {userId} = req.body;

    try {
       const taskWithUser = await taskService.assignTask(id,userId);
       
       return res.status(200).json({
        success:true,
        message: 'Tarea asignada correctamente',
        data: taskWithUser
       });
    } catch (error) {
        console.log(error);

        //manejo de errores especificos definidos en el servicio
        if (error.message === 'TASK_NOT_FOUND') {
            return res.status(404).json({
                success:false,
                message: 'La tarea no existe',
                data:null
            });
        }

        if (error.message === 'USER_NOT_FOUND') {
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

export {
    getTasks,
    createTask,
    assignTask
}